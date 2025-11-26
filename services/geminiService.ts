import { GoogleGenAI, Content, Part } from "@google/genai";
import { GEMINI_MODEL_TEXT, GEMINI_MODEL_VISION, SYSTEM_INSTRUCTION } from "../constants";
import { UploadedFile, Message } from "../types";

// Initialize the client
// NOTE: Process.env.API_KEY is handled by the build/runtime environment automatically.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an abstract AI background wallpaper using Imagen.
 */
export const generateWallpaper = async (): Promise<string> => {
  try {
    // Explicitly using Imagen as requested by user
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001', 
      prompt: 'Abstract representation of artificial intelligence, neural connections, glowing nodes in deep blue and cyan space, digital brain, futuristic data flow, high quality, 4k resolution, wallpaper style, subtle geometric patterns',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const base64String = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64String}`;
  } catch (error) {
    console.error("Imagen API Error:", error);
    throw new Error("Failed to generate wallpaper. Please try again.");
  }
};

/**
 * Extracts text from an image file using Gemini Vision capabilities (OCR).
 */
export const performOCR = async (file: File): Promise<string> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    const base64String = base64Data.split(',')[1];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64String
              }
            },
            { text: "Please transcribe all the text found in this image exactly as it appears. If the image contains handwriting, try your best to read it. If there is no text, describe the image in detail suitable for study notes. Output only the extracted text or description." }
          ]
        }
      ]
    });

    return response.text || "No text could be extracted from this image.";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image.");
  }
};

export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null
): Promise<string> => {
  try {
    const model = GEMINI_MODEL_TEXT;

    // Construct the chat history for the API
    let parts: Part[] = [{ text: currentQuery }];
    let contents: Content[] = [];

    // Transform app history to API history
    const previousHistory: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    contents = [...previousHistory];

    if (file) {
      if (file.category === 'image' && !file.originalImage) {
        // Pure image upload (fallback if OCR wasn't used)
        const base64Data = file.content.split(',')[1]; 
        parts.unshift({
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        });
        parts.unshift({ text: "Here is the image file I uploaded for reference: " });
      } else {
        // Text file or OCR'd Text
        // If it was an image originally, file.originalImage will be present, but file.content is the OCR text.
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