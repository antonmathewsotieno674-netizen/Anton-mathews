
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig, ProjectPlan } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Helper for simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateWallpaper = async (): Promise<string> => {
  await delay(1500);
  // Return a high-quality abstract background from Unsplash source
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"; 
};

export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  await delay(2000);
  // Return a placeholder image reflecting the request
  const text = encodeURIComponent(config.prompt.substring(0, 30) || "Generated Image");
  return `https://placehold.co/1024x1024/0284c7/white?text=${text}`;
};

export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  await delay(3000);
  // Return a sample video for demonstration
  return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
};

export const generateSpeech = async (text: string): Promise<string> => {
  // This is deprecated in favor of window.speechSynthesis in App.tsx
  // Keeping function signature just in case, but it won't be used by the updated App.tsx
  return ""; 
};

export const performOCR = async (file: File): Promise<string> => {
  await delay(2000);
  return `[Simulated OCR] Extracted text from ${file.name}.\n\nThis is a simulated extraction of text from the image. In a full local implementation, libraries like Tesseract.js would be used here to process the image data client-side.`;
};

export const analyzeMedia = async (file: File): Promise<string> => {
  await delay(2500);
  return `[Simulated Analysis] Media file: ${file.name}\n\nType: ${file.type}\nAnalysis: The media appears to contain educational content. Key topics identified include biology, history, and mathematics. (This is a mock analysis for the independent version).`;
};

export const consolidateMemory = async (history: Message[], currentMemory?: string): Promise<string> => {
  // Simple pass-through or basic concatenation for simulation
  return currentMemory || "User is focusing on general studies.";
};

export const generateProjectPlan = async (goal: string, context?: string): Promise<ProjectPlan> => {
  await delay(1500);
  return { 
    id: `proj_${Date.now()}`, 
    title: `Project: ${goal}`, 
    steps: [
      { step: "Phase 1: Research", details: "Gather requirements and study materials.", status: 'pending' },
      { step: "Phase 2: Outline", details: "Create a structure for the project based on gathered data.", status: 'pending' },
      { step: "Phase 3: Execution", details: "Begin drafting the content.", status: 'pending' },
      { step: "Phase 4: Review", details: "Refine and polish the final output.", status: 'pending' }
    ] 
  };
};

export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null,
  mode: ModelMode = 'standard',
  location?: { lat: number; lng: number },
  longTermMemory?: string
): Promise<{ text: string, groundingLinks?: GroundingLink[] }> => {
  await delay(1000 + Math.random() * 800);
  
  let text = `[MOA AI Independent]\nI received your query: "${currentQuery}"`;

  if (file) {
    text += `\n\nI am analyzing the file: ${file.name} (${file.type}).`;
    if (currentQuery.toLowerCase().includes("summary")) {
      text += `\n\nHere is a summary: This document contains important information regarding the subject matter. It outlines key definitions, methodologies, and conclusions relevant to your study goals.`;
    } else {
      text += `\n\nBased on the document context, I can help you understand the core concepts. What specific part would you like to discuss?`;
    }
  } else {
    if (currentQuery.toLowerCase().includes("hello") || currentQuery.toLowerCase().includes("hi")) {
      text = "Hello! I am MOA AI, your independent study assistant. How can I help you learn today?";
    } else {
      text += `\n\nAs an independent AI, I am simulating a response to help you study. I don't have real-time internet access in this mode, but I can help you structure your thoughts and plan your projects.`;
    }
  }

  if (mode === 'thinking') {
    text = `Thinking Process:\n1. Analyze input "${currentQuery}"\n2. Contextualize with ${file ? file.name : "no file"}\n3. Formulate educational response.\n\n` + text;
  }

  if (location && mode === 'maps') {
    text += `\n\n[Location Context] Detected coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}. Searching for nearby study spots (Simulated).`;
  }

  return { 
    text: text, 
    groundingLinks: mode === 'search' ? [{ title: 'Simulated Source', uri: 'https://example.com', source: 'search' }] : [] 
  };
};

export const extractTasks = async (file: UploadedFile | null, history: Message[]): Promise<ActionItem[]> => {
  await delay(1000);
  return [
    { id: `t_${Date.now()}_1`, content: 'Review lecture notes', isCompleted: false },
    { id: `t_${Date.now()}_2`, content: 'Summarize key terms', isCompleted: false },
    { id: `t_${Date.now()}_3`, content: 'Prepare questions for next class', isCompleted: false }
  ];
};
