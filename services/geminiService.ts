
import { GoogleGenAI, Content, Part, Modality, Type } from "@google/genai";
import { 
  GEMINI_MODEL_STANDARD, 
  GEMINI_MODEL_FAST, 
  GEMINI_MODEL_THINKING, 
  GEMINI_MODEL_MAPS,
  GEMINI_MODEL_SEARCH,
  GEMINI_MODEL_VISION,
  GEMINI_MODEL_VIDEO_UNDERSTANDING,
  GEMINI_MODEL_AUDIO_TRANSCRIPTION,
  MODEL_IMAGE_GEN,
  MODEL_VIDEO_GEN,
  MODEL_TTS,
  SYSTEM_INSTRUCTION 
} from "../constants";
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig, ProjectPlan } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ... (Previous media generation functions remain unchanged: generateWallpaper, generateProImage, generateVideo, generateSpeech, performOCR, analyzeMedia) ...
export const generateWallpaper = async (): Promise<string> => {
  const prompt = 'Futuristic abstract data landscape, flowing streams of glowing neural nodes, deep indigo and cybernetic blue gradients, subtle glass morphism effects, 8k resolution, ultra-detailed, cinematic lighting, sleek modern UI background, abstract intelligence';
  try {
    const response = await ai.models.generateContent({ model: MODEL_IMAGE_GEN, contents: { parts: [{ text: prompt }] }, config: { imageConfig: { aspectRatio: '16:9', imageSize: '2K' } }, });
    for (const part of response.candidates?.[0]?.content?.parts || []) { if (part.inlineData) { return `data:image/png;base64,${part.inlineData.data}`; } }
    throw new Error("No image data returned.");
  } catch (error) { console.warn("Imagen generation failed:", error); throw error; }
};
export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  const response = await ai.models.generateContent({ model: MODEL_IMAGE_GEN, contents: { parts: [{ text: config.prompt }] }, config: { imageConfig: { aspectRatio: config.aspectRatio, imageSize: config.imageSize || '1K' } }, });
  for (const part of response.candidates?.[0]?.content?.parts || []) { if (part.inlineData) { return `data:image/png;base64,${part.inlineData.data}`; } }
  throw new Error("Failed to generate image.");
};
export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  const validAspectRatio = config.aspectRatio === '9:16' ? '9:16' : '16:9';
  let operation;
  if (config.referenceImage) {
    const base64Data = config.referenceImage.split(',')[1];
    const mimeType = config.referenceImage.match(/data:([^;]+);/)?.[1] || 'image/png';
    operation = await ai.models.generateVideos({ model: MODEL_VIDEO_GEN, prompt: config.prompt, image: { imageBytes: base64Data, mimeType: mimeType }, config: { numberOfVideos: 1, aspectRatio: validAspectRatio, resolution: '720p' } });
  } else {
    operation = await ai.models.generateVideos({ model: MODEL_VIDEO_GEN, prompt: config.prompt, config: { numberOfVideos: 1, aspectRatio: validAspectRatio, resolution: '720p' } });
  }
  while (!operation.done) { await new Promise(resolve => setTimeout(resolve, 5000)); operation = await ai.operations.getVideosOperation({ operation: operation }); }
  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed.");
  return `${videoUri}&key=${process.env.API_KEY}`;
};
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({ model: MODEL_TTS, contents: { parts: [{ text }] }, config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }, }, }, }, });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) return base64Audio;
  throw new Error("Failed to generate speech.");
};
export const performOCR = async (file: File): Promise<string> => {
  try {
    const base64Data = await fileToBase64(file);
    const base64String = base64Data.split(',')[1];
    const response = await ai.models.generateContent({ model: GEMINI_MODEL_VISION, contents: [ { role: 'user', parts: [ { inlineData: { mimeType: file.type, data: base64String } }, { text: "Perform high-accuracy Optical Character Recognition (OCR) on this image. Extract ALL visible text verbatim. Maintain the original structure using Markdown (headers, lists, tables). If the image is low quality, angled, or handwritten, use advanced reasoning to infer the text accurately." } ] } ] });
    return response.text || "No insights found.";
  } catch (error) { throw new Error("Failed to analyze image."); }
};
export const analyzeMedia = async (file: File): Promise<string> => {
  const base64Data = await fileToBase64(file);
  const base64String = base64Data.split(',')[1];
  const isVideo = file.type.startsWith('video');
  const response = await ai.models.generateContent({ model: isVideo ? GEMINI_MODEL_VIDEO_UNDERSTANDING : GEMINI_MODEL_AUDIO_TRANSCRIPTION, contents: [ { role: 'user', parts: [ { inlineData: { mimeType: file.type, data: base64String } }, { text: isVideo ? "Analyze this video. Summarize key events." : "Transcribe this audio file." } ] } ] });
  return response.text || "Analysis complete.";
};

/**
 * Consolidate Memory: Creates a summary of the conversation to act as long-term memory
 */
export const consolidateMemory = async (history: Message[], currentMemory?: string): Promise<string> => {
  if (history.length < 2) return currentMemory || "";

  try {
    const prompt = `
      Analyze the following conversation history and the existing memory context.
      Synthesize a concise "Long-Term Memory" block. 
      - Retain key facts about the user (name, goals, specific projects).
      - Retain critical decisions or conclusions reached.
      - Discard transient chit-chat.
      - If existing memory contradicts recent chat, update it.
      
      Existing Memory: ${currentMemory || "None"}
      
      Output ONLY the updated memory text block.
    `;

    // Use fast model for summarization
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: [
        { role: 'user', parts: [{ text: JSON.stringify(history.map(h => ({ role: h.role, text: h.text }))) }] },
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });

    return response.text || currentMemory || "";
  } catch (error) {
    console.warn("Memory consolidation failed:", error);
    return currentMemory || "";
  }
};

/**
 * Goal-Oriented Scaffolding: Generates a project plan
 */
export const generateProjectPlan = async (goal: string, context?: string): Promise<ProjectPlan> => {
  try {
    const prompt = `
      The user has a high-level goal: "${goal}".
      Context: ${context || "None"}.
      
      Break this down into a logical, sequential Project Plan.
      Return JSON format:
      {
        "title": "Project Title",
        "steps": [
          { "step": "Step Name", "details": "Actionable details...", "status": "pending" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_THINKING, // Use thinking model for complex planning
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 4096 } // Moderate thinking budget
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return {
      id: `proj_${Date.now()}`,
      title: parsed.title || "Project Plan",
      steps: parsed.steps || []
    };
  } catch (error) {
    console.error("Scaffolding failed:", error);
    throw error;
  }
};

/**
 * Main Chat / Response Generation with Memory Injection
 */
export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null,
  mode: ModelMode = 'standard',
  location?: { lat: number; lng: number },
  longTermMemory?: string // NEW: Inject persistent memory
): Promise<{ text: string, groundingLinks?: GroundingLink[] }> => {
  try {
    let modelName = GEMINI_MODEL_STANDARD;
    
    // Inject Memory into System Instruction
    let baseInstruction = SYSTEM_INSTRUCTION;
    if (longTermMemory) {
        baseInstruction += `\n\n--- LONG-TERM MEMORY (PERSISTENT CONTEXT) ---\n${longTermMemory}\n--- END MEMORY ---\n`;
    }

    let config: any = { systemInstruction: baseInstruction };

    switch (mode) {
      case 'fast': modelName = GEMINI_MODEL_FAST; break;
      case 'thinking': 
        modelName = GEMINI_MODEL_THINKING; 
        config.thinkingConfig = { thinkingBudget: 32768 };
        break;
      case 'maps': 
        modelName = GEMINI_MODEL_MAPS; 
        config.tools = [{ googleMaps: {} }];
        if (location) {
          config.toolConfig = { retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } } };
        }
        break;
      case 'search':
        modelName = GEMINI_MODEL_SEARCH;
        config.tools = [{ googleSearch: {} }];
        break;
    }

    // Context Management (Truncation)
    const MAX_HISTORY_LENGTH = 30;
    const effectiveHistory = history.length > MAX_HISTORY_LENGTH 
      ? history.slice(history.length - MAX_HISTORY_LENGTH) 
      : history;

    const contents: Content[] = effectiveHistory.map(msg => {
        const parts: Part[] = [];
        if (msg.attachment) {
            const matches = msg.attachment.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
            }
        }
        parts.push({ text: msg.text });
        return { role: msg.role, parts: parts };
    });

    if (file) {
      const contextParts: Part[] = [];
      if (file.category === 'text') {
        const SAFE_TEXT_LIMIT = 2000000;
        let fileContent = file.content;
        if (fileContent.length > SAFE_TEXT_LIMIT) {
            fileContent = fileContent.substring(0, SAFE_TEXT_LIMIT) + "\n[Truncated]";
        }
        contextParts.push({ text: `\n\n--- FILE CONTEXT (${file.name}) ---\n${fileContent}\n--- END CONTEXT ---\n` });
      } else if (!file.originalImage) {
        const base64Data = file.content.split(',')[1];
        contextParts.push({ inlineData: { mimeType: file.type, data: base64Data } });
        contextParts.push({ text: "Reference the uploaded file above." });
      }
      
      if (contents.length > 0 && contents[0].role === 'user') {
         contents[0].parts = [...contextParts, ...contents[0].parts];
      } else {
         contents.unshift({ role: 'user', parts: contextParts });
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: config
    });

    let finalText = response.text || "No response generated.";
    let groundingLinks: GroundingLink[] = [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) groundingLinks.push({ title: chunk.web.title || 'Web Source', uri: chunk.web.uri, source: 'search' });
      });
    }

    return { text: finalText, groundingLinks };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('token count exceeds') || error.message?.includes('400')) {
        return { text: "⚠️ Context too large. Please clear chat or upload smaller files." };
    }
    throw error;
  }
};

/**
 * Task Extraction (Simple)
 */
export const extractTasks = async (file: UploadedFile | null, history: Message[]): Promise<ActionItem[]> => {
  try {
    const prompt = `Analyze context and chat. Return JSON: { "tasks": ["Task 1", "Task 2"] }.`;
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_STANDARD,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text || '{}');
    return (parsed.tasks || []).map((t: string, i: number) => ({ id: `t_${Date.now()}_${i}`, content: t, isCompleted: false }));
  } catch (e) { return []; }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
