
export const APP_NAME = "MOA AI";
export const APP_VERSION = "2.0.0";
export const PREMIUM_PRICE_KSH = 20;

// Model Definitions
export const GEMINI_MODEL_STANDARD = "gemini-2.5-flash"; 
export const GEMINI_MODEL_FAST = "gemini-2.5-flash-lite-latest"; 
export const GEMINI_MODEL_THINKING = "gemini-3-pro-preview"; 
export const GEMINI_MODEL_MAPS = "gemini-2.5-flash"; 
export const GEMINI_MODEL_SEARCH = "gemini-2.5-flash";
export const GEMINI_MODEL_VISION = "gemini-3-pro-preview"; // Upgraded for better image understanding
export const GEMINI_MODEL_VIDEO_UNDERSTANDING = "gemini-3-pro-preview";
export const GEMINI_MODEL_AUDIO_TRANSCRIPTION = "gemini-2.5-flash";

// Generation Models
export const MODEL_IMAGE_GEN = "gemini-3-pro-image-preview";
export const MODEL_VIDEO_GEN = "veo-3.1-fast-generate-preview";
export const MODEL_TTS = "gemini-2.5-flash-preview-tts";

export const STORAGE_KEY = "MOA_APP_STATE_V1";
export const LIBRARY_STORAGE_KEY = "MOA_PUBLIC_LIBRARY_V1";

export const PREMIUM_VALIDITY_MS = 60 * 24 * 60 * 60 * 1000; 

export const FREE_QUESTIONS_LIMIT = 5;
export const USAGE_WINDOW_MS = 60 * 60 * 1000; 

export const SYSTEM_INSTRUCTION = `You are MOA AI, an intelligent study and creative assistant. 
Help users understand notes, analyze images/videos, and generate content.
Answer questions strictly based on context if provided.
Be concise, professional, and educational.`;

export const SOCIAL_LINKS = {
  whatsapp: "https://whatsapp.com/channel/0029VbC7zQcAO7RJFqYIIA2A",
  telegram: "https://t.me/moa_ai"
};

export const INITIAL_LIBRARY_DATA = [
  {
    id: 'lib_001',
    title: 'Introduction to Biology Form 4',
    author: 'Teacher Alice',
    description: 'Comprehensive notes covering Genetics and Evolution.',
    category: 'Biology',
    fileContent: 'Genetics is the study of heredity and the variation of inherited characteristics...',
    fileType: 'text/plain',
    date: '2023-10-15',
    downloads: 120
  },
  {
    id: 'lib_002',
    title: 'History of Kenya - Independence',
    author: 'John Doe',
    description: 'Key events leading to independence in 1963.',
    category: 'History',
    fileContent: 'Kenya achieved independence on December 12, 1963. Jomo Kenyatta became the first president...',
    fileType: 'text/plain',
    date: '2023-11-02',
    downloads: 85
  }
];
