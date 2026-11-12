export type ChatCategory = 'UMUM' | 'NIK_DATA' | 'SK_KEPENGURUSAN' | 'EKTA_DPP' | 'KENDALA_SISTEM';

export interface SupportMessage {
  id: string;
  threadId: string; // NIK Pengurus atau Username
  senderNik: string;
  senderName: string;
  senderRole: string;
  senderDpd?: string;
  senderDpc?: string;
  senderDprt?: string;
  senderJabatan?: string;
  recipientRole: 'SUPER_ADMIN' | 'PENGURUS';
  recipientNik?: string;
  recipientName?: string;
  category: ChatCategory;
  message: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

export interface SupportThread {
  threadId: string;
  pengurusNik: string;
  pengurusName: string;
  pengurusRole: string;
  pengurusDpd: string;
  pengurusDpc?: string;
  pengurusDprt?: string;
  pengurusJabatan?: string;
  lastMessage: string;
  lastMessageTime: string;
  category: ChatCategory;
  recipientNik?: string;
  recipientName?: string;
  unreadCount: number;
}

export interface SendMessagePayload {
  category?: ChatCategory;
  message: string;
  attachmentUrl?: string;
  threadId?: string; // Diisi oleh Super Admin saat membalas
  recipientNik?: string;
  recipientName?: string;
}

export interface AdminTargetOption {
  id: string; // 'ALL_DPW' atau NIK/Username admin
  nik?: string;
  name: string;
  role: string;
  jabatan?: string;
  isDefaultTeam?: boolean;
}

export type SupportChatEvent =
  | { type: 'NEW_MESSAGE'; threadId: string }
  | { type: 'READ_UPDATE'; threadId: string }
  | { type: 'TYPING'; threadId: string; senderName: string; senderRole: string };

