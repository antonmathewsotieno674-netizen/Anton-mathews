
import { UploadedFile, Message, ActionItem, ModelMode, GroundingLink, MediaGenerationConfig, ProjectPlan } from "../types";

// MOA API: Independent AI Service Implementation
// Includes Client-Side RAG (Retrieval Augmented Generation) & Multimodal Analysis Simulation.

const SIMULATED_LATENCY = 1200; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- TYPES FOR MULTIMODAL ANALYSIS ---

interface VisualFeature {
  object: string;
  confidence: number;
  boundingBox: { x: number, y: number, w: number, h: number };
  attributes?: string[];
}

interface VideoAnalysisFrame {
  timestamp: string;
  action: string;
  objects: string[];
}

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

// --- MULTIMODAL ANALYSIS SIMULATION (CNN/ViT/RNN) ---

// A. Image Analysis (Single Frame) - Simulating CNN/ViT
const analyzeImageDeeply = async (file: UploadedFile): Promise<string> => {
  // Simulation of Object Detection & Segmentation
  const detectedObjects: VisualFeature[] = [
    { object: "Person", confidence: 0.98, boundingBox: { x: 10, y: 20, w: 100, h: 250 }, attributes: ["standing", "casual_wear"] },
    { object: "Laptop", confidence: 0.92, boundingBox: { x: 120, y: 150, w: 80, h: 60 }, attributes: ["open", "silver"] },
    { object: "Coffee_Cup", confidence: 0.85, boundingBox: { x: 210, y: 160, w: 20, h: 30 }, attributes: ["ceramic", "white"] }
  ];

  const segmentationMap = "Background: Office_Interior (70%), Foreground: Desk_Setup (30%)";
  
  // Simulation of OCR (Optical Character Recognition)
  const extractedText = "MOCK_TEXT_LAYER: 'Project Deadline: Oct 24' detected on screen surface.";

  return JSON.stringify({
    analysis_type: "CNN_ViT_Ensemble",
    detected_objects: detectedObjects,
    segmentation: segmentationMap,
    ocr_content: extractedText,
    feature_extraction: "High-level textures: [Matte_Finish, Fabric_Texture]"
  }, null, 2);
};

// B. Video Analysis (Sequence) - Simulating RNN/Temporal Tracking
const analyzeVideoSequence = async (file: UploadedFile): Promise<string> => {
  // Simulation of Frame Extraction & Activity Recognition
  const frames: VideoAnalysisFrame[] = [
    { timestamp: "00:00", action: "Scene_Entry", objects: ["Person_A"] },
    { timestamp: "00:05", action: "Walking", objects: ["Person_A", "Doorway"] },
    { timestamp: "00:12", action: "Interaction (Picking Up)", objects: ["Person_A", "Document_Folder"] },
    { timestamp: "00:20", action: "Reading", objects: ["Person_A", "Document"] }
  ];

  return JSON.stringify({
    analysis_type: "Temporal_RNN_Tracking",
    frame_rate_sample: "5fps",
    sequence_log: frames,
    scene_understanding: "Office environment. Subject retrieves and analyzes a physical document."
  }, null, 2);
};

// --- END MULTIMODAL UTILITIES ---

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
  // Enhanced OCR Simulation
  return `[MOA Vision - OCR Module]\nSource: ${file.name}\n\n---\n\n(Header Detected): CHAPTER 4: CELLULAR RESPIRATION\n\n(Body Text Block 1):\nCellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert chemical energy from oxygen molecules or nutrients into adenosine triphosphate (ATP).\n\n(Diagram Label Detected): [Mitochondria Structure]\n\n(Handwritten Note Detected): *Remember the Kreb's Cycle inputs!*\n\n---\nConfidence Score: 0.96`;
};

export const analyzeMedia = async (file: File): Promise<string> => {
  await delay(2500);
  if (file.type.startsWith('video')) {
    const analysis = await analyzeVideoSequence({ name: file.name, type: file.type, content: '', category: 'video' });
    return `[MOA Video Analysis]\n${analysis}`;
  } else {
    const analysis = await analyzeImageDeeply({ name: file.name, type: file.type, content: '', category: 'image' });
    return `[MOA Image Analysis]\n${analysis}`;
  }
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

  // 1. Multimodal Integration (Image/Video)
  if (file && (file.category === 'image' || file.category === 'video')) {
     text += `**Multimodal Analysis Protocol Active**\n`;
     
     if (file.category === 'image') {
       const visualData = await analyzeImageDeeply(file);
       // Data Fusion Strategy
       text += `I have processed the visual features of "${file.name}" using the internal CNN/ViT architecture.\n\n`;
       text += `**Visual Insights Extracted:**\n\`\`\`json\n${visualData}\n\`\`\`\n\n`;
       text += `**Response:**\nBased on these detected objects and segmentation masks, the image appears to depict a study or office environment. The recognized text indicates a project deadline.`;
     } else {
       const videoData = await analyzeVideoSequence(file);
       text += `I have performed temporal analysis on the video sequence "${file.name}".\n\n`;
       text += `**Temporal Log:**\n\`\`\`json\n${videoData}\n\`\`\`\n\n`;
       text += `**Response:**\nThe subject demonstrates active engagement with the material, transitioning from walking to focused reading.`;
     }
     return { text, groundingLinks: [] };
  }

  // 2. RAG-Enabled Response for Text Files
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

  // 3. Specific Modes
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

  // 4. Fallback / General Conversation
  if (lowerQuery.match(/\b(hi|hello|hey)\b/)) {
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
