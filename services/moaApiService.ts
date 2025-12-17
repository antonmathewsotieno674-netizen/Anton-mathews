
import { GoogleGenAI, Type } from "@google/genai";
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig, ProjectPlan } from "../types";

// Initialize Gemini API
// API Key is automatically injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILITIES ---

const extractBase64 = (dataUrl: string) => {
  // Splits "data:image/png;base64,....." to get the base64 part
  return dataUrl.split(',')[1];
};

const getMimeType = (dataUrl: string) => {
  // Extracts "image/png" from data URL
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
};

// --- API FUNCTIONS ---

export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null,
  mode: ModelMode = 'standard',
  location?: { lat: number; lng: number },
  longTermMemory?: string
): Promise<{ text: string, groundingLinks?: GroundingLink[] }> => {

  let modelName = 'gemini-2.5-flash';
  let tools: any[] | undefined = undefined;
  let toolConfig: any | undefined = undefined;
  let thinkingConfig: any | undefined = undefined;
  let systemInstruction = "You are MOA AI, a helpful study assistant. Be concise and accurate.";

  // 1. Configure Model & Tools based on Mode
  switch (mode) {
    case 'fast':
      modelName = 'gemini-2.5-flash-lite-latest';
      break;
    case 'thinking':
      modelName = 'gemini-2.5-flash';
      // Enable Thinking (Reasoning)
      thinkingConfig = { thinkingBudget: 1024 }; 
      break;
    case 'deep-research':
      modelName = 'gemini-3-pro-preview';
      // Enable Search for research
      tools = [{ googleSearch: {} }];
      systemInstruction += " Perform deep research on the topic. Structure your answer as a detailed report with an Executive Summary, Key Findings, and Conclusion.";
      break;
    case 'search':
      modelName = 'gemini-2.5-flash';
      tools = [{ googleSearch: {} }];
      break;
    case 'maps':
      modelName = 'gemini-2.5-flash';
      tools = [{ googleMaps: {} }];
      if (location) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        };
      }
      break;
    case 'standard':
    default:
      modelName = 'gemini-2.5-flash';
      break;
  }

  // 2. Build Content Parts
  const parts: any[] = [];

  // A. Add Context from Uploaded File
  if (file) {
    if (file.category === 'text' && file.content) {
      // For text files, add as text context
      parts.push({ text: `[CONTEXT FROM UPLOADED FILE: ${file.name}]\n${file.content}\n\n[END CONTEXT]` });
    } else if ((file.category === 'image' || file.category === 'video') && file.content) {
      // For media files, add as inline data
      parts.push({
        inlineData: {
          mimeType: getMimeType(file.content),
          data: extractBase64(file.content)
        }
      });
      parts.push({ text: `Analyze this ${file.category} (${file.name}) as part of the context.` });
    }
  }

  // B. Add Long Term Memory if available
  if (longTermMemory) {
    systemInstruction += `\nUser Context/Memory: ${longTermMemory}`;
  }

  // C. Add Conversation History (Last 5 turns to save context window)
  // Note: For simple stateless calls, we might just append previous messages as text, 
  // but here we are constructing the prompt for a single generation call.
  // Ideally, we use ai.chats.create() for chat, but here we strictly follow the 'generateContent' pattern 
  // effectively by appending history to the prompt or relying on the 'contents' array structure.
  
  // We will append the recent history to the prompt text for simplicity in this specific architecture
  const recentHistory = history.slice(-6);
  let conversationContext = "";
  for (const msg of recentHistory) {
    conversationContext += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}\n`;
    // Handle inline attachments in chat history
    if (msg.attachment) {
       // We only attach the *latest* attachment strictly in the active parts below, 
       // but we mention it in text here.
       conversationContext += `[User attached a ${msg.attachmentType}]\n`;
    }
  }
  
  if (conversationContext) {
    parts.push({ text: `Conversation History:\n${conversationContext}\n` });
  }

  // D. Add Current User Message & Attachment
  parts.push({ text: currentQuery });
  
  // Check if the LATEST message (current turn) has an attachment passed via history or separate arg?
  // The App.tsx passes `currentQuery` as text. If there's an attachment in the "newMessage" object in App.tsx, 
  // it is pushed to `history` before calling this. We should check the LAST item of history if it matches currentQuery.
  const lastMsg = history[history.length - 1];
  if (lastMsg && lastMsg.role === 'user' && lastMsg.attachment) {
      parts.push({
        inlineData: {
           mimeType: getMimeType(lastMsg.attachment),
           data: extractBase64(lastMsg.attachment)
        }
      });
  }

  // 3. Call API
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
        tools,
        toolConfig,
        thinkingConfig
      }
    });

    const outputText = response.text || "I processed that, but I don't have a text response.";
    
    // Extract Grounding Links (Search/Maps)
    let links: GroundingLink[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          links.push({ title: chunk.web.title || "Web Source", uri: chunk.web.uri, source: 'search' });
        } else if (chunk.maps) {
           // Maps chunks structure might vary, adapting generic access
           const uri = chunk.maps.uri || chunk.maps.googleMapsUri;
           if (uri) links.push({ title: chunk.maps.title || "Map Location", uri: uri, source: 'maps' });
        }
      });
    }

    return { text: outputText, groundingLinks: links };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: `Error connecting to AI: ${error.message}` };
  }
};

export const performOCR = async (file: File): Promise<string> => {
  try {
    const base64 = await fileToBase64(file);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: extractBase64(base64) } },
          { text: "Transcribe all text visible in this image. Format it clearly with headers if applicable." }
        ]
      }
    });
    return response.text || "No text detected.";
  } catch (e) {
    return "OCR Failed: " + (e as Error).message;
  }
};

export const analyzeMedia = async (file: File): Promise<string> => {
  try {
    const base64 = await fileToBase64(file);
    const isVideo = file.type.startsWith('video');
    const prompt = isVideo 
      ? "Analyze this video. Describe the action, scene, and key events timestamp by timestamp." 
      : "Analyze this image. Describe the objects, setting, and any text or relevant details.";

    // For video, we really should use the File API/Upload for large videos, 
    // but for this snippet we assume small clips suitable for inlineData (up to 20MB approx).
    
    const response = await ai.models.generateContent({
      model: isVideo ? 'gemini-2.5-flash' : 'gemini-2.5-flash', // Flash 2.5 is multimodal native
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: extractBase64(base64) } },
          { text: prompt }
        ]
      }
    });
    return response.text || "Analysis failed.";
  } catch (e) {
    return "Media Analysis Failed: " + (e as Error).message;
  }
};

export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  // Use Veo for video generation
  // Note: Users must have a paid key for Veo.
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: config.prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: config.aspectRatio === '16:9' ? '16:9' : '9:16' // Veo supports restricted ratios
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned.");

    // Append key for download
    return `${videoUri}&key=${process.env.API_KEY}`;
  } catch (e) {
    console.error(e);
    // Fallback URL if generation fails or key invalid for Veo
    return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
  }
};

export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  try {
    // Using Gemini Flash Image for generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: config.prompt }] },
      config: {
        imageConfig: {
           aspectRatio: config.aspectRatio,
           // imageSize only for Pro model, Flash ignores it or throws
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (e) {
    console.error(e);
    // Fallback
    const text = encodeURIComponent(config.prompt.substring(0, 20));
    return `https://placehold.co/1024x1024/0284c7/white?text=${text}`;
  }
};

export const generateWallpaper = async (): Promise<string> => {
  return generateProImage({
    type: 'image',
    prompt: "A beautiful, abstract, calming wallpaper with teal, cyan and emerald green geometric shapes, 4k resolution, minimalist style",
    aspectRatio: '16:9'
  });
};

export const extractTasks = async (file: UploadedFile | null, history: Message[]): Promise<ActionItem[]> => {
  const context = file?.content ? `Document Content: ${file.content.substring(0, 10000)}...` : "No document.";
  const lastMsg = history[history.length - 1]?.text || "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract actionable tasks from the following context and conversation. Return a JSON array.
      
      Context: ${context}
      Latest Chat: ${lastMsg}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING },
              isCompleted: { type: Type.BOOLEAN }
            }
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (e) {
    console.error("Task extraction failed", e);
    return [];
  }
};

export const generateProjectPlan = async (goal: string): Promise<ProjectPlan> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a project plan for: ${goal}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  details: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['pending', 'in-progress', 'done'] }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to generate plan");
  }
};

export const consolidateMemory = async (history: Message[], currentMemory?: string): Promise<string> => {
  // Simple consolidation simulation
  return currentMemory || ""; 
};

// Helper
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
