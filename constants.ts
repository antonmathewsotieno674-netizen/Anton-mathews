
export const APP_NAME = "MOA AI";
export const PREMIUM_PRICE_KSH = 20;
export const GEMINI_MODEL_TEXT = "gemini-2.5-flash"; // Good for text analysis
export const GEMINI_MODEL_VISION = "gemini-2.5-flash"; // Good for multimodal
export const STORAGE_KEY = "MOA_APP_STATE_V1";
export const LIBRARY_STORAGE_KEY = "MOA_PUBLIC_LIBRARY_V1";

// 2 Months in milliseconds (approx 60 days)
export const PREMIUM_VALIDITY_MS = 60 * 24 * 60 * 60 * 1000; 

// Rate Limiting
export const FREE_QUESTIONS_LIMIT = 5;
export const USAGE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const SYSTEM_INSTRUCTION = `You are MOA AI, an intelligent study assistant. 
Your goal is to help users understand their uploaded notes. 
Answer questions strictly based on the provided context if possible. 
If the context is insufficient, use your general knowledge but mention that it's outside the provided notes.
Be concise, professional, and educational.`;

export const SOCIAL_LINKS = {
  whatsapp: "https://wa.me/254757634590", // Direct to WhatsApp
  telegram: "https://t.me/moa_ai" // Placeholder for Telegram
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
  },
  {
    id: 'lib_003',
    title: 'Physics Formulas Cheat Sheet',
    author: 'Science Club',
    description: 'All essential formulas for Mechanics and Thermodynamics.',
    category: 'Physics',
    fileContent: 'Force = Mass x Acceleration (F=ma). Energy = mc^2. Power = Work / Time...',
    fileType: 'text/plain',
    date: '2024-01-10',
    downloads: 340
  }
];
