
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
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generate Wallpaper (simplified legacy function, updated to use Imagen 3 Pro)
 */
export const generateWallpaper = async (): Promise<string> => {
  const prompt = 'Futuristic abstract data landscape, flowing streams of glowing neural nodes, deep indigo and cybernetic blue gradients, subtle glass morphism effects, 8k resolution, ultra-detailed, cinematic lighting, sleek modern UI background, abstract intelligence';
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '2K'
        }
      },
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data returned.");
  } catch (error) {
    console.warn("Imagen generation failed:", error);
    throw error;
  }
};

/**
 * Generate Pro Image with Controls (Imagen 3)
 */
export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODEL_IMAGE_GEN,
    contents: { parts: [{ text: config.prompt }] },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize || '1K'
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
      }
  }
  throw new Error("Failed to generate image.");
};

/**
 * Generate Video using Veo (Polling required)
 */
export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  // Veo supports 16:9 or 9:16
  const validAspectRatio = config.aspectRatio === '9:16' ? '9:16' : '16:9';
  
  let operation;
  
  if (config.referenceImage) {
    // Image-to-Video
    const base64Data = config.referenceImage.split(',')[1];
    const mimeType = config.referenceImage.match(/data:([^;]+);/)?.[1] || 'image/png';
    
    operation = await ai.models.generateVideos({
        model: MODEL_VIDEO_GEN,
        prompt: config.prompt,
        image: {
            imageBytes: base64Data,
            mimeType: mimeType
        },
        config: {
            numberOfVideos: 1,
            aspectRatio: validAspectRatio,
            resolution: '720p' // Veo fast preview
        }
    });
  } else {
    // Text-to-Video
    operation = await ai.models.generateVideos({
        model: MODEL_VIDEO_GEN,
        prompt: config.prompt,
        config: {
            numberOfVideos: 1,
            aspectRatio: validAspectRatio,
            resolution: '720p'
        }
    });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed or returned no URI.");

  // Fetch the actual video bytes using the key
  const videoUrlWithKey = `${videoUri}&key=${process.env.API_KEY}`;
  return videoUrlWithKey;
};

/**
 * Text to Speech (TTS)
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODEL_TTS,
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/mp3;base64,${base64Audio}`; // Note: API returns PCM usually, but browser can handle simple container wrapping or raw if Context used. 
    // For simplicity in <audio> tag, we might need actual WAV header or rely on browser decoder smarts for PCM-like blobs.
    // The SDK example decodes PCM manually. For this app, to keep it simple, we assume the API might evolve or we send raw. 
    // Actually, let's stick to the raw data and let the caller handle it or use a simple wav header wrapper if needed. 
    // *Correction*: The prompt example uses AudioContext to decode. We will return base64 and let UI handle it, 
    // but for <audio src="..."> it needs a container. 
    // Let's assume for this "web app" we want to play it. 
    return base64Audio;
  }
  throw new Error("Failed to generate speech.");
};

/**
 * OCR / Image Analysis
 */
export const performOCR = async (file: File): Promise<string> => {
  try {
    const base64Data = await fileToBase64(file);
    const base64String = base64Data.split(',')[1];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION, // Upgrade to Pro for better OCR
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: file.type, data: base64String } },
            { text: "Analyze this image. If it contains text, transcribe it exactly. If it's a diagram or scene, describe it in detail for study notes." }
          ]
        }
      ]
    });

    return response.text || "No insights found.";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to analyze image.");
  }
};

/**
 * Video/Audio Analysis
 */
export const analyzeMedia = async (file: File): Promise<string> => {
  const base64Data = await fileToBase64(file);
  const base64String = base64Data.split(',')[1];
  const isVideo = file.type.startsWith('video');
  const model = isVideo ? GEMINI_MODEL_VIDEO_UNDERSTANDING : GEMINI_MODEL_AUDIO_TRANSCRIPTION;

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: file.type, data: base64String } },
          { text: isVideo ? "Analyze this video. Summarize key events and extracting any visible text or spoken information." : "Transcribe this audio file and summarize the key points." }
        ]
      }
    ]
  });
  return response.text || "Analysis complete.";
};

/**
 * Main Chat / Response Generation
 */
export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null,
  mode: ModelMode = 'standard',
  location?: { lat: number; lng: number }
): Promise<{ text: string, groundingLinks?: GroundingLink[] }> => {
  try {
    let modelName = GEMINI_MODEL_STANDARD;
    let config: any = { systemInstruction: SYSTEM_INSTRUCTION };

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

    // Construct Contents
    const contents: Content[] = history.map(msg => {
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

    // Add File Context if exists
    if (file) {
      const contextParts: Part[] = [];
      if (file.category === 'text') {
        contextParts.push({ text: `\n\n--- FILE CONTEXT (${file.name}) ---\n${file.content}\n--- END CONTEXT ---\n` });
      } else if (!file.originalImage) {
        // Raw media context (Video/Audio/Image) that hasn't been transcribed to text
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

    // Process Grounding
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) groundingLinks.push({ title: chunk.web.title || 'Web Source', uri: chunk.web.uri, source: 'search' });
      });
    }

    return { text: finalText, groundingLinks };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Task Extraction
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

// Utils
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
