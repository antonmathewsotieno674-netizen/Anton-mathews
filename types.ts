
export type ModelMode = 'standard' | 'fast' | 'thinking' | 'maps' | 'search';

export interface GroundingLink {
  title: string;
  uri: string;
  source?: 'maps' | 'search';
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: string; // Base64 data URL
  attachmentType?: 'image' | 'video' | 'audio';
  isError?: boolean;
  groundingLinks?: GroundingLink[];
  modelMode?: ModelMode;
  generatedMedia?: {
    type: 'image' | 'video' | 'audio';
    url: string; // Data URL or Blob URL
    mimeType: string;
  };
}

export interface UploadedFile {
  name: string;
  type: string;
  content: string; // Base64 or Text
  category: 'image' | 'text' | 'video' | 'audio';
  originalImage?: string; 
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  fileContent: string;
  fileType: string;
  date: string;
  downloads: number;
  originalImage?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  authMethod: 'email' | 'phone' | 'google';
  profilePicture?: string;
}

export interface PaymentRecord {
  id: string;
  date: number;
  amount: number;
  method: string;
}

export interface DownloadRecord {
  id: string;
  itemTitle: string;
  itemAuthor: string;
  date: number;
}

export interface UploadRecord {
  id: string;
  name: string;
  type: string;
  size?: number;
  date: number;
}

export interface UserState {
  user: User | null;
  isPremium: boolean;
  hasPaid: boolean;
  premiumExpiryDate?: number;
  paymentHistory: PaymentRecord[];
  downloadHistory: DownloadRecord[];
  uploadHistory: UploadRecord[];
  questionUsage: number[];
  longTermMemory?: string; // Persisted knowledge base about user/projects
}

export interface ActionItem {
  id: string;
  content: string;
  isCompleted: boolean;
}

// Advanced Scaffolding
export interface ProjectStep {
  step: string;
  details: string;
  status: 'pending' | 'in-progress' | 'done';
}

export interface ProjectPlan {
  id: string;
  title: string;
  steps: ProjectStep[];
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface MediaGenerationConfig {
  type: 'image' | 'video';
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  imageSize?: '1K' | '2K' | '4K'; // Only for image
  referenceImage?: string; // Base64 for Veo image-to-video or editing
}
