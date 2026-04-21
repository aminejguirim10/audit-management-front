export interface MessageResponse {
  id: number;
  auditId: number;
  senderId: number | null;
  senderName: string | null;
  receiverId: number | null;
  receiverName: string | null;
  content: string;
  sentAt: string;
}

export interface SendMessageRequest {
  content: string;
  receiverId?: number | null;
}
