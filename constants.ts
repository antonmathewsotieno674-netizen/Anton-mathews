
export const APP_NAME = "MOA AI";
export const APP_VERSION = "2.1.0";
export const PREMIUM_PRICE_KSH = 20;

// MOA Internal Models
export const MOA_MODEL_STANDARD = "moa-standard"; 
export const MOA_MODEL_FAST = "moa-fast"; 
export const MOA_MODEL_THINKING = "moa-reasoning"; 
export const MOA_MODEL_MAPS = "moa-geo"; 
export const MOA_MODEL_SEARCH = "moa-search";

export const STORAGE_KEY = "MOA_APP_STATE_V1";
export const LIBRARY_STORAGE_KEY = "MOA_PUBLIC_LIBRARY_V1";

export const PREMIUM_VALIDITY_MS = 60 * 24 * 60 * 60 * 1000; 

export const FREE_QUESTIONS_LIMIT = 5;
export const USAGE_WINDOW_MS = 60 * 60 * 1000; 

export const SYSTEM_INSTRUCTION = `SYSTEM INSTRUCTION: ACCURACY PROTOCOL
You are MOA AI, a reliable Question-Answering assistant.

CORE PROTOCOLS:
1. **Accuracy First (RAG)**: 
   - Your sole purpose is to answer the user's question based ONLY on the text provided in the user's notes.
   - You must not use guesswork.
   - If the answer is not contained entirely within the provided notes, you must respond with: "The required information is not available in your notes."

2. **Cross-Modal Reasoning**:
   - You can see both uploaded documents (text/PDF) and chat attachments.
   - Correlate these sources.

3. **Goal-Oriented**:
   - Provide concise and direct answers.
   - When users ask for plans, break them down into steps.

Be professional, educational, and strictly grounded in the provided context.`;

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
