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
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  authMethod: 'email' | 'phone' | 'google';
}

export interface UserState {
  user: User | null;
  isPremium: boolean;
  hasPaid: boolean;
}
