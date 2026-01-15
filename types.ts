
// This file contains the shared TypeScript interfaces for the MOA AI application.

export interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: string;
  attachmentType?: string;
  modelMode?: string;
  generatedMedia?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    mimeType: string;
  };
  groundingLinks?: Array<{ title: string; uri: string; source: string }>;
  isError?: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  authMethod: 'email' | 'phone' | 'google';
  profilePicture?: string;
}

export interface UploadRecord {
  id: string;
  name: string;
  type: string;
  size?: number;
  date: number;
  content?: string;
  category: string;
  originalImage?: string;
}

export interface UserState {
  user: User | null;
  isPremium: boolean;
  hasPaid: boolean;
  paymentHistory: any[];
  downloadHistory: any[];
  uploadHistory: UploadRecord[];
  questionUsage: number[];
  longTermMemory: string;
  premiumExpiryDate?: number;
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
}

export interface ActionItem {
  id: string;
  content: string;
  isCompleted: boolean;
}

export interface MediaGenerationConfig {
  type: 'image' | 'video';
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  imageSize?: '1K' | '2K' | '4K';
}
