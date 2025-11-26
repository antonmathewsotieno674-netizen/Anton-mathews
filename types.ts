
export interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  content: string; // Base64 for images, text string for text files
  category: 'image' | 'text';
  originalImage?: string; // Keep original base64 for display if OCR was performed
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  fileContent: string; // The actual content to be loaded
  fileType: string; // mime type
  date: string;
  downloads: number;
  originalImage?: string; // Optional: Keep original image for library items
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  authMethod: 'email' | 'phone' | 'google';
}

export interface PaymentRecord {
  id: string;
  date: number;
  amount: number;
  method: string;
}

export interface UserState {
  user: User | null;
  isPremium: boolean;
  hasPaid: boolean;
  premiumExpiryDate?: number; // Timestamp in milliseconds
  paymentHistory: PaymentRecord[];
}

// PWA Install Prompt Event
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
