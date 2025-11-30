export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: string;
  htmlCode: string;
  history: ChatMessage[];
  synced?: boolean; // Indicates if synced to Neon DB
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export type ViewMode = 'desktop' | 'tablet' | 'mobile';
export type EditorTab = 'preview' | 'code';
export type AppRoute = 'landing' | 'signin' | 'signup' | 'dashboard' | 'playground';
