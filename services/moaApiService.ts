
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig, ProjectPlan } from "../types";

// MOA API: Independent AI Service Implementation
// Includes Client-Side RAG (Retrieval Augmented Generation) for accuracy.

const SIMULATED_LATENCY = 800; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- RAG UTILITIES ---

// 1. Chunking Strategy (Pre-Processing Stage)
const chunkText = (text: string, chunkSize: number = 300): string[] => {
  // Split by sentence boundaries to preserve meaning
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
};

// 2. Retrieval Strategy (Semantic/Keyword Search)
const retrieveContext = (query: string, text: string): string[] => {
  if (!text) return [];
  const chunks = chunkText(text);
  
  // Basic TF-IDF-like scoring based on query terms
  const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  if (queryTerms.length === 0) return chunks.slice(0, 3); // Fallback if query is too short

  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    queryTerms.forEach(term => {
      if (chunkLower.includes(term)) score += 1;
    });
    // Boost score if chunk contains multiple distinct query terms
    const uniqueTermsFound = queryTerms.filter(term => chunkLower.includes(term)).length;
    score += uniqueTermsFound * 2;
    
    return { chunk, score };
  });

  // Sort by score and take top 3
  scoredChunks.sort((a, b) => b.score - a.score);
  const relevant = scoredChunks.filter(x => x.score > 0);
  
  // If no relevance found, return first chunk (intro) and random middle chunk
  if (relevant.length === 0) return [chunks[0], chunks[Math.floor(chunks.length / 2)]].filter(Boolean);
  
  return relevant.slice(0, 3).map(x => x.chunk);
};

// --- END RAG UTILITIES ---

const TEMPLATES = {
  greetings: [
    "Hello! I am MOA AI, your independent study companion. How can I assist you today?",
    "Hi there! Ready to learn? Upload some notes or ask me a question.",
    "Greetings! I'm here to help you study smarter."
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
  return "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop"; 
};

export const generateProImage = async (config: MediaGenerationConfig): Promise<string> => {
  await delay(2000);
  const text = encodeURIComponent(config.prompt.substring(0, 50));
  return `https://placehold.co/1024x1024/0284c7/white?text=${text}`;
};

export const generateVideo = async (config: MediaGenerationConfig): Promise<string> => {
  await delay(3000);
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

  // 1. RAG-Enabled Response for Text Files
  if (file && file.category === 'text' && file.content) {
      const retrievedContext = retrieveContext(currentQuery, file.content);
      
      // Simulate the thought process in the response for transparency (Accuracy Protocol)
      if (retrievedContext.length > 0) {
          text = `**Accuracy Protocol: Context Retrieval**\nI found ${retrievedContext.length} relevant sections in your notes:\n\n`;
          retrievedContext.forEach((chunk, i) => {
              text += `> *"...${chunk.substring(0, 100)}..."*\n`;
          });
          text += `\n**Answer:**\nBased on these sections, `;
          
          if (lowerQuery.includes('summary')) {
              text += "the document outlines the core themes efficiently. " + retrievedContext[0];
          } else if (lowerQuery.includes('meaning') || lowerQuery.includes('define')) {
              text += "the definition is implied in the context. " + retrievedContext[0];
          } else {
              text += `the notes suggest that this topic is central to the subject. specifically: ${retrievedContext[0]}`;
          }
          return { text, groundingLinks: [] };
      } else {
          text += `I scanned your document "${file.name}" but couldn't find a direct match for "${currentQuery}". Could you rephrase or ask about a different topic in the file?`;
          return { text, groundingLinks: [] };
      }
  }

  // 2. Specific Modes
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

  // 3. Fallback / General Conversation
  if (file && file.category !== 'text') {
      text = `I can see the ${file.category} file "${file.name}". While I can't read text directly from this media type yet, I can discuss its general metadata or visual analysis if you generated it.`;
  } else if (lowerQuery.match(/\b(hi|hello|hey)\b/)) {
      text = pick(TEMPLATES.greetings);
  } else if (lowerQuery.includes('plan') || lowerQuery.includes('project')) {
      text = "I can help you plan that. Use the 'Deep Think' mode or ask me to generate a project plan to get a structured breakdown.";
  } else {
      text = pick(TEMPLATES.general);
  }

  if (mode === 'thinking') {
    text = `🧠 **MOA Reasoning**:\n1. Identified intent: ${lowerQuery}\n2. Retrieved knowledge context.\n3. Formulating structured response.\n\n---\n\n${text}`;
  } else if (mode === 'fast') {
    text = `⚡ ${text}`;
  }

  if (longTermMemory && Math.random() > 0.8) {
     text += `\n\n(Recalling: ${longTermMemory})`;
  }

  return { text, groundingLinks: [] };
};
