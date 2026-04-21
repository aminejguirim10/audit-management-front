export type AiConversationMessageRole = 'USER' | 'ASSISTANT';

export interface AiConversationSummary {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  imageCount: number;
}

export interface AiConversationImage {
  id: number;
  filename: string | null;
  mediaType: string | null;
  bucketName: string | null;
  storagePath: string;
  publicUrl: string;
  createdAt: string;
}

export interface AiConversationMessage {
  id: number;
  role: AiConversationMessageRole;
  content: string;
  auditCriterion: string | null;
  createdAt: string;
  images: AiConversationImage[];
}

export interface AiConversationDetails {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  imageCount: number;
  messages: AiConversationMessage[];
}

export interface PersistAiConversationImageRequest {
  filename: string | null;
  mediaType: string | null;
  bucketName: string | null;
  storagePath: string;
  publicUrl: string;
}

export interface PersistAiConversationTurnRequest {
  userContent: string;
  assistantContent: string;
  auditCriterion: string | null;
  images: PersistAiConversationImageRequest[];
}
