export interface NotificationResponse {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  messageId: number | null;
  auditId: number | null;
  senderId: number | null;
  senderName: string | null;
}
