
import { GoogleGenAI, Content, Part, Modality } from "@google/genai";
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

// Helper to get a fresh client instance with the latest key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract image data from response
const extractImageFromResponse = (response: any): string => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned.");
};

export const generateWallpaper = async (): Promise<string> => {
  const ai = getAI();
  const prompt = 'Futuristic abstract data landscape, flowing streams of glowing neural nodes, deep indigo and cybernetic blue gradients, subtle glass morphism effects, 8k resolution, ultra-detailed, cinematic lighting, sleek modern UI background, abstract intelligence';
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '16:9', imageSize: '2K' } },
    });
    return extractImageFromResponse(response);
  } catch (error: any) {
    if (error.message?.includes('404') || error.status === 404) {
      console.warn("Imagen 3 Pro 404, falling back to Flash Image");
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: '16:9' } },
      });
      return extractImageFromResponse(response);
    }
    throw error;
  }
};

export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: { parts: [{ text: config.prompt }] },
      config: { imageConfig: { aspectRatio: config.aspectRatio, imageSize: config.imageSize || '1K' } },
    });
    return extractImageFromResponse(response);
  } catch (error: any) {
    if (error.message?.includes('404') || error.status === 404) {
      console.warn("Imagen 3 Pro 404, falling back to Flash Image");
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: config.prompt }] },
        config: { imageConfig: { aspectRatio: config.aspectRatio } },
      });
      return extractImageFromResponse(response);
    }
    throw error;
  }
};

export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  const ai = getAI();
  const validAspectRatio = config.aspectRatio === '9:16' ? '9:16' : '16:9';
  let operation;
  try {
    if (config.referenceImage) {
      const base64Data = config.referenceImage.split(',')[1];
      const mimeType = config.referenceImage.match(/data:([^;]+);/)?.[1] || 'image/png';
      operation = await ai.models.generateVideos({ model: MODEL_VIDEO_GEN, prompt: config.prompt, image: { imageBytes: base64Data, mimeType: mimeType }, config: { numberOfVideos: 1, aspectRatio: validAspectRatio, resolution: '720p' } });
    } else {
      operation = await ai.models.generateVideos({ model: MODEL_VIDEO_GEN, prompt: config.prompt, config: { numberOfVideos: 1, aspectRatio: validAspectRatio, resolution: '720p' } });
    }
    
    while (!operation.done) { 
        await new Promise(resolve => setTimeout(resolve, 10000)); 
        operation = await ai.operations.getVideosOperation({ operation: operation }); 
    }
    
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed.");
    return `${videoUri}&key=${process.env.API_KEY}`;
  } catch (error: any) {
    console.error("Video generation failed:", error);
    throw new Error("Video generation unavailable. Please try again later.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({ model: MODEL_TTS, contents: { parts: [{ text }] }, config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }, }, }, }, });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) return base64Audio;
  throw new Error("Failed to generate speech.");
};

export const performOCR = async (file: File): Promise<string> => {
  const ai = getAI();
  try {
    const base64Data = await fileToBase64(file);
    const base64String = base64Data.split(',')[1];
    
    const tryOCR = async (model: string) => {
        return await ai.models.generateContent({
            model: model,
            contents: [
                { role: 'user', parts: [ { inlineData: { mimeType: file.type, data: base64String } }, { text: "Perform high-accuracy Optical Character Recognition (OCR) on this image. Extract ALL visible text verbatim. Maintain the original structure using Markdown (headers, lists, tables). If the image is low quality, angled, or handwritten, use advanced reasoning to infer the text accurately." } ] }
            ]
        });
    };

    try {
        const response = await tryOCR(GEMINI_MODEL_VISION);
        return response.text || "No insights found.";
    } catch (e: any) {
        if (e.message?.includes('404') || e.status === 404) {
            console.warn("Vision Pro 404, falling back to Standard");
            const response = await tryOCR(GEMINI_MODEL_STANDARD);
            return response.text || "No insights found.";
        }
        throw e;
    }
  } catch (error) { throw new Error("Failed to analyze image."); }
};

export const analyzeMedia = async (file: File): Promise<string> => {
  const ai = getAI();
  const base64Data = await fileToBase64(file);
  const base64String = base64Data.split(',')[1];
  const isVideo = file.type.startsWith('video');
  const targetModel = isVideo ? GEMINI_MODEL_VIDEO_UNDERSTANDING : GEMINI_MODEL_AUDIO_TRANSCRIPTION;

  const tryAnalyze = async (model: string) => {
      return await ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [ { inlineData: { mimeType: file.type, data: base64String } }, { text: isVideo ? "Analyze this video. Summarize key events." : "Transcribe this audio file." } ] }
        ]
      });
  };

  try {
      const response = await tryAnalyze(targetModel);
      return response.text || "Analysis complete.";
  } catch (e: any) {
      if (e.message?.includes('404') || e.status === 404) {
          console.warn("Media Pro 404, falling back to Standard");
          const response = await tryAnalyze(GEMINI_MODEL_STANDARD);
          return response.text || "Analysis complete.";
      }
      throw e;
  }
};

export const consolidateMemory = async (history: Message[], currentMemory?: string): Promise<string> => {
  if (history.length < 2) return currentMemory || "";
  const ai = getAI();
  try {
    const prompt = `Analyze the following conversation history and the existing memory context. Synthesize a concise "Long-Term Memory" block. Retain key facts about the user (name, goals, specific projects). Retain critical decisions or conclusions reached. Output ONLY the updated memory text block.\n\nExisting Memory: ${currentMemory || "None"}`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL_FAST, contents: [ { role: 'user', parts: [{ text: JSON.stringify(history.map(h => ({ role: h.role, text: h.text }))) }] }, { role: 'user', parts: [{ text: prompt }] } ] });
    return response.text || currentMemory || "";
  } catch (error) { return currentMemory || ""; }
};

export const generateProjectPlan = async (goal: string, context?: string): Promise<ProjectPlan> => {
  const ai = getAI();
  try {
    const prompt = `The user has a high-level goal: "${goal}". Context: ${context || "None"}. Break this down into a logical, sequential Project Plan. Return JSON format: { "title": "Project Title", "steps": [ { "step": "Step Name", "details": "Actionable details...", "status": "pending" } ] }`;
    
    try {
        const response = await ai.models.generateContent({ model: GEMINI_MODEL_THINKING, contents: [{ role: 'user', parts: [{ text: prompt }] }], config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 4096 } } });
        return { id: `proj_${Date.now()}`, title: JSON.parse(response.text!).title, steps: JSON.parse(response.text!).steps };
    } catch (e: any) {
        if (e.message?.includes('404') || e.status === 404) {
             const response = await ai.models.generateContent({ model: GEMINI_MODEL_STANDARD, contents: [{ role: 'user', parts: [{ text: prompt }] }], config: { responseMimeType: 'application/json' } });
             return { id: `proj_${Date.now()}`, title: JSON.parse(response.text!).title, steps: JSON.parse(response.text!).steps };
        }
        throw e;
    }
  } catch (error) { throw error; }
};

export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null,
  mode: ModelMode = 'standard',
  location?: { lat: number; lng: number },
  longTermMemory?: string
): Promise<{ text: string, groundingLinks?: GroundingLink[] }> => {
  const ai = getAI();
  try {
    let modelName = GEMINI_MODEL_STANDARD;
    
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
      if (file.content && typeof file.content === 'string' && !file.content.startsWith('data:')) {
        const SAFE_TEXT_LIMIT = 2000000;
        let fileContent = file.content;
        if (fileContent.length > SAFE_TEXT_LIMIT) {
            fileContent = fileContent.substring(0, SAFE_TEXT_LIMIT) + "\n[Truncated]";
        }
        contextParts.push({ text: `\n\n--- FILE CONTEXT (${file.name}) ---\n${fileContent}\n--- END CONTEXT ---\n` });
      } 
      
      if (file.originalImage) {
        const base64Data = file.originalImage.split(',')[1];
        const mimeType = file.originalImage.match(/data:([^;]+);/)?.[1] || 'image/png';
        contextParts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
      } else if (file.category !== 'text' && file.content.startsWith('data:')) {
        const base64Data = file.content.split(',')[1];
        const mimeType = file.content.match(/data:([^;]+);/)?.[1] || file.type || 'application/octet-stream';
        contextParts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
      }
      
      if (contextParts.length > 0) {
        if (contents.length > 0 && contents[0].role === 'user') {
           contents[0].parts = [...contextParts, ...contents[0].parts];
        } else {
           contents.unshift({ role: 'user', parts: contextParts });
        }
      }
    }

    try {
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
                if (chunk.web?.uri) {
                  groundingLinks.push({ title: chunk.web.title || 'Web Source', uri: chunk.web.uri, source: 'search' });
                }
                if (chunk.maps?.uri) {
                  groundingLinks.push({ title: chunk.maps.title || 'Map Location', uri: chunk.maps.uri, source: 'maps' });
                }
            });
        }
        return { text: finalText, groundingLinks };

    } catch (e: any) {
        if ((e.message?.includes('404') || e.status === 404) && mode === 'thinking') {
            console.warn("Thinking Model 404, falling back to Standard");
            const fallbackConfig = { ...config };
            delete fallbackConfig.thinkingConfig; 
            
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL_STANDARD,
                contents: contents,
                config: fallbackConfig
            });
            return { text: response.text || "No response.", groundingLinks: [] };
        }
        throw e;
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('token count exceeds') || error.message?.includes('400')) {
        return { text: "⚠️ Context too large. Please clear chat or upload smaller files." };
    }
    throw error;
  }
};

export const extractTasks = async (file: UploadedFile | null, history: Message[]): Promise<ActionItem[]> => {
  const ai = getAI();
  try {
    let context = "";
    if (file && file.category === 'text') {
      context += `Document Content: ${file.content.substring(0, 10000)}...\n\n`;
    }
    if (history.length > 0) {
      context += `Chat History:\n${history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}\n\n`;
    }

    const prompt = `Analyze the following context (Document and Chat) and extract a list of actionable tasks or to-do items implied or explicitly stated. Return JSON format: { "tasks": ["Task 1", "Task 2"] }. \n\n${context}`;
    
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
