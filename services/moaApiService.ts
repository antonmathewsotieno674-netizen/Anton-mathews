
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig, ProjectPlan } from "../types";

// MOA API: Independent AI Service Implementation
// This service runs entirely client-side or interacts with a hypothetical MOA backend
// ensuring the app is free and independent of paid external APIs.

const SIMULATED_LATENCY = 800; // ms

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Intelligent Response Templates
const TEMPLATES = {
  greetings: [
    "Hello! I am MOA AI, your independent study companion. How can I assist you today?",
    "Hi there! Ready to learn? Upload some notes or ask me a question.",
    "Greetings! I'm here to help you study smarter."
  ],
  summary: [
    "Here is a summary of the key points:\n\n1. The main concept revolves around the core subject matter.\n2. Critical analysis suggests a strong correlation between the variables.\n3. The conclusion emphasizes the importance of further study.",
    "To summarize: The document covers essential definitions, historical context, and methodological approaches relevant to the topic."
  ],
  definitions: [
    "Based on my knowledge base, this term refers to a fundamental concept in the field, often characterized by its specific properties and interactions with other elements.",
  ],
  general: [
    "That's an insightful question. Based on the context, I suggest focusing on the underlying principles.",
    "I can help you break this down. Could you provide more specific details from your notes?",
    "Interesting point. Let's analyze this further. What specific outcome are you looking for?"
  ]
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const generateWallpaper = async (): Promise<string> => {
  await delay(1500);
  // MOA AI Art Generation (Simulated)
  return "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop"; 
};

export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  await delay(2000);
  const text = encodeURIComponent(config.prompt.substring(0, 50));
  // Return a placeholder that represents the generated image
  return `https://placehold.co/1024x1024/0284c7/white?text=${text}`;
};

export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  await delay(3000);
  // Return a sample video URL
  return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
};

export const performOCR = async (file: File): Promise<string> => {
  await delay(2000);
  return `[MOA Vision] Text extracted from ${file.name}:\n\nThis is a simulated extraction. In a production environment, MOA AI would process the pixel data locally to identify text regions and convert them to editable string formats.\n\nDetected content includes headers, paragraphs, and potential diagram labels.`;
};

export const analyzeMedia = async (file: File): Promise<string> => {
  await delay(2500);
  return `[MOA Media Analysis]\nFile: ${file.name}\nType: ${file.type}\n\nAnalysis: The media appears to be educational in nature. Audio/Video tracks indicate spoken content regarding academic subjects. Visual frames contain textual information and charts.`;
};

export const consolidateMemory = async (history: Message[], currentMemory?: string): Promise<string> => {
  // Local memory consolidation logic
  return currentMemory || "User prefers concise answers and is studying general topics.";
};

export const generateProjectPlan = async (goal: string, context?: string): Promise<ProjectPlan> => {
  await delay(1500);
  return { 
    id: `moa_proj_${Date.now()}`, 
    title: `MOA Plan: ${goal}`, 
    steps: [
      { step: "Phase 1: Conceptualization", details: "Define the scope and key objectives.", status: 'pending' },
      { step: "Phase 2: Resource Gathering", details: "Collect necessary study materials and references.", status: 'pending' },
      { step: "Phase 3: Development", details: "Draft the initial version of the project.", status: 'pending' },
      { step: "Phase 4: Refinement", details: "Review against requirements and polish.", status: 'pending' }
    ] 
  };
};

export const extractTasks = async (file: UploadedFile | null, history: Message[]): Promise<ActionItem[]> => {
  await delay(1000);
  return [
    { id: `t_${Date.now()}_1`, content: 'Review chapter summaries', isCompleted: false },
    { id: `t_${Date.now()}_2`, content: 'Practice quiz questions', isCompleted: false },
    { id: `t_${Date.now()}_3`, content: 'Draft essay outline', isCompleted: false },
    { id: `t_${Date.now()}_4`, content: 'Research related topics online', isCompleted: false }
  ];
};

export const generateResponse = async (
  history: Message[],
  currentQuery: string,
  file: UploadedFile | null,
  mode: ModelMode = 'standard',
  location?: { lat: number; lng: number },
  longTermMemory?: string
): Promise<{ text: string, groundingLinks?: GroundingLink[] }> => {
  await delay(SIMULATED_LATENCY + Math.random() * 500);
  
  const lowerQuery = currentQuery.toLowerCase();
  let text = "";

  // 1. Check for specific modes
  if (mode === 'maps' && location) {
    text = `[MOA Maps]\nBased on your location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}), I found several study spots nearby:\n\n1. Central Library (0.5km)\n2. Campus Coffee Hub (1.2km)\n3. Quiet Park Zone (0.8km)`;
    return { 
        text, 
        groundingLinks: [
            { title: "Central Library", uri: "https://maps.google.com", source: "maps" },
            { title: "Campus Coffee Hub", uri: "https://maps.google.com", source: "maps" }
        ]
    };
  }

  if (mode === 'search') {
    text = `[MOA Search]\nI found the following information regarding "${currentQuery}":\n\nThe topic is widely discussed in recent academic literature. Key developments include new methodologies for analysis and improved data verification techniques.`;
    return {
        text,
        groundingLinks: [
            { title: "Academic Source A", uri: "https://example.com/source-a", source: "search" },
            { title: "Educational Resource B", uri: "https://example.com/resource-b", source: "search" }
        ]
    };
  }

  // 2. Contextual Response Generation
  if (file) {
    text += `Analyzing context from "${file.name}"...\n\n`;
    if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
        text += pick(TEMPLATES.summary);
    } else if (lowerQuery.includes('define') || lowerQuery.includes('meaning')) {
        text += pick(TEMPLATES.definitions);
    } else {
        text += `Regarding your question about "${currentQuery}" in the context of this file: The document discusses this concept in detail, linking it to the broader subject matter.`;
    }
  } else {
    // General Conversation
    if (lowerQuery.match(/\b(hi|hello|hey)\b/)) {
        text = pick(TEMPLATES.greetings);
    } else if (lowerQuery.includes('plan') || lowerQuery.includes('project')) {
        text = "I can help you plan that. Use the 'Deep Think' mode or ask me to generate a project plan to get a structured breakdown.";
    } else {
        text = pick(TEMPLATES.general);
    }
  }

  // 3. Mode Enhancements
  if (mode === 'thinking') {
    text = `🧠 **MOA Reasoning**:\n1. Identified intent: ${lowerQuery}\n2. Retrieved knowledge context.\n3. Formulating structured response.\n\n---\n\n${text}`;
  } else if (mode === 'fast') {
    text = `⚡ ${text}`;
  }

  // 4. Memory Integration
  if (longTermMemory && Math.random() > 0.7) {
     text += `\n\n(Recalling: ${longTermMemory})`;
  }

  return { text, groundingLinks: [] };
};
