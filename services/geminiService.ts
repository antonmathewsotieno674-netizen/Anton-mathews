import { GoogleGenAI, Content, Part } from "@google/genai";
import { GEMINI_MODEL_TEXT, SYSTEM_INSTRUCTION } from "../constants";
import { UploadedFile, Message } from "../types";

// Initialize the client
// NOTE: Process.env.API_KEY is handled by the build/runtime environment automatically.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null
): Promise<string> => {
  try {
    const model = GEMINI_MODEL_TEXT;

    // Construct the chat history for the API
    // We treat the file as part of the context of the conversation
    
    let parts: Part[] = [{ text: currentQuery }];
    let contents: Content[] = [];

    // Transform app history to API history
    const previousHistory: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    contents = [...previousHistory];

    // If there is a file, we need to inject it into the context effectively.
    // For this simple implementation, if a file exists, we attach it to the latest prompt 
    // or system instruction logic if it hasn't been "seen" yet. 
    // To keep it stateless and robust, we attach the file data to the user's turn if provided.
    
    if (file) {
      if (file.category === 'image') {
        // Remove the data URL prefix for the API
        const base64Data = file.content.split(',')[1]; 
        parts.unshift({
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        });
        parts.unshift({ text: "Here is the image file I uploaded for reference: " });
      } else {
        // Text file
        parts.unshift({ text: `\n\n--- BEGIN UPLOADED NOTE CONTENT (${file.name}) ---\n${file.content}\n--- END NOTE CONTENT ---\n\nBased on the note above: ` });
      }
    }

    contents.push({ role: 'user', parts: parts });

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I couldn't generate a response based on that input.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from AI. Please try again.");
  }
};
