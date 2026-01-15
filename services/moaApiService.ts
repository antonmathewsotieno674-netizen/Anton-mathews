
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILITIES ---

const extractBase64 = (dataUrl) => {
  if (!dataUrl) return "";
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
};

const getMimeType = (dataUrl) => {
  if (!dataUrl || !dataUrl.includes(':')) return "image/jpeg";
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
};

// --- API FUNCTIONS ---

export const generateResponse = async (
  history,
  currentQuery,
  file,
  mode = 'standard',
  location,
  longTermMemory
) => {

  let modelName = 'gemini-3-flash-preview';
  let tools = undefined;
  let toolConfig = undefined;
  let thinkingConfig = undefined;
  let systemInstruction = "You are MOA AI, a helpful study assistant. Be concise and accurate.";

  switch (mode) {
    case 'fast':
      modelName = 'gemini-flash-lite-latest';
      break;
    case 'thinking':
      modelName = 'gemini-3-flash-preview';
      thinkingConfig = { thinkingBudget: 1024 }; 
      break;
    case 'deep-research':
      modelName = 'gemini-3-pro-preview';
      tools = [{ googleSearch: {} }];
      systemInstruction += " Perform deep research on the topic. Structure your answer as a detailed report.";
      break;
    case 'search':
      modelName = 'gemini-3-flash-preview';
      tools = [{ googleSearch: {} }];
      break;
    case 'maps':
      modelName = 'gemini-3-flash-preview';
      tools = [{ googleSearch: {} }]; // Maps uses Search grounding in Gemini 3 series or specific tools
      break;
    case 'standard':
    default:
      modelName = 'gemini-3-flash-preview';
      break;
  }

  const parts = [];

  if (file) {
    if (file.category === 'text' && file.content) {
      parts.push({ text: `[CONTEXT FROM UPLOADED FILE: ${file.name}]\n${file.content}\n\n[END CONTEXT]` });
    } else if ((file.category === 'image' || file.category === 'video') && file.content) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(file.content),
          data: extractBase64(file.content)
        }
      });
      parts.push({ text: `Analyze this ${file.category} (${file.name}) as part of the context.` });
    }
  }

  if (longTermMemory) {
    systemInstruction += `\nUser Context/Memory: ${longTermMemory}`;
  }

  const recentHistory = history.slice(-6);
  let conversationContext = "";
  for (const msg of recentHistory) {
    conversationContext += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}\n`;
    if (msg.attachment) {
       conversationContext += `[User attached a ${msg.attachmentType}]\n`;
    }
  }
  
  if (conversationContext) {
    parts.push({ text: `Conversation History:\n${conversationContext}\n` });
  }

  parts.push({ text: currentQuery });
  
  const lastMsg = history[history.length - 1];
  if (lastMsg && lastMsg.role === 'user' && lastMsg.attachment) {
      parts.push({
        inlineData: {
           mimeType: getMimeType(lastMsg.attachment),
           data: extractBase64(lastMsg.attachment)
        }
      });
  }

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
    
    let links = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk) => {
        if (chunk.web) {
          links.push({ title: chunk.web.title || "Web Source", uri: chunk.web.uri, source: 'search' });
        }
      });
    }

    return { text: outputText, groundingLinks: links };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: `Error connecting to AI: ${error.message}` };
  }
};

export const performOCR = async (fileData, mimeType) => {
  try {
    const base64 = extractBase64(fileData);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64 } },
          { text: "Transcribe all text visible in this image. Format it clearly with headers if applicable. If it's a form or table, try to preserve the structure as much as possible using Markdown." }
        ]
      }
    });
    return response.text || "No text detected.";
  } catch (e) {
    console.error("OCR API Error:", e);
    throw new Error("OCR Failed: " + e.message);
  }
};

export const analyzeMedia = async (file) => {
  try {
    const base64 = await fileToBase64(file);
    const isVideo = file.type.startsWith('video');
    const prompt = isVideo 
      ? "Analyze this video. Describe the action, scene, and key events timestamp by timestamp." 
      : "Analyze this image. Describe the objects, setting, and any text or relevant details.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: extractBase64(base64) } },
          { text: prompt }
        ]
      }
    });
    return response.text || "Analysis failed.";
  } catch (e) {
    return "Media Analysis Failed: " + e.message;
  }
};

export const generateVideo = async (config) => {
  try {
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
    }

    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let operation = await veoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: config.prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: config.aspectRatio === '16:9' ? '16:9' : '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await veoAi.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned.");

    return `${videoUri}&key=${process.env.API_KEY}`;
  } catch (e) {
    console.error(e);
    return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"; 
  }
};

export const generateProImage = async (config) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: config.prompt }] },
      config: {
        imageConfig: {
           aspectRatio: config.aspectRatio,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (e) {
    console.error(e);
    const text = encodeURIComponent(config.prompt.substring(0, 20));
    return `https://placehold.co/1024x1024/0284c7/white?text=${text}`;
  }
};

export const generateWallpaper = async () => {
  return generateProImage({
    type: 'image',
    prompt: "A beautiful, abstract, calming wallpaper with teal, cyan and emerald green geometric shapes, 4k resolution, minimalist style",
    aspectRatio: '16:9'
  });
};

export const extractTasks = async (file, history) => {
  const context = file?.content ? `Document Content: ${file.content.substring(0, 10000)}...` : "No document.";
  const lastMsg = history[history.length - 1]?.text || "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

export const generateProjectPlan = async (goal) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

export const consolidateMemory = async (history, currentMemory) => {
  return currentMemory || ""; 
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
