import { apiFetch } from '../../services/http';
import { UserSession } from '../../types';
import {
  SupportMessage,
  SupportThread,
  SendMessagePayload,
  SupportChatEvent,
  AdminTargetOption,
} from './types';

const LOCAL_STORAGE_KEY = 'nasdem_support_chat_messages_v1';
const CHAT_CHANNEL_NAME = 'nasdem_support_chat_channel';

// Inisialisasi BroadcastChannel untuk sinkronisasi instan real-time lintas tab/window
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(CHAT_CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

const notifyRealtimeUpdate = (data: SupportChatEvent) => {
  // 1. Kirim via BroadcastChannel (lintas tab/jendela)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(data);
    } catch {
      /* abaikan */
    }
  }
  // 2. Kirim via CustomEvent lokal (dalam tab yang sama)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nasdem_chat_event', { detail: data }));
  }
};

const getLocalMessages = (): SupportMessage[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMessages = (messages: SupportMessage[]): void => {
  try {
    // Deduplikasi pesan berdasarkan id dan urutkan kronologis
    const map = new Map<string, SupportMessage>();
    (messages || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    const sorted = Array.from(map.values()).sort((a, b) =>
      (a.createdAt || '').localeCompare(b.createdAt || '')
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
  } catch (err) {
    console.warn('Gagal menyimpan chat ke local storage:', err);
  }
};

export const supportChatService = {
  /**
   * Mengambil riwayat pesan untuk thread tertentu
   */
  async getMessages(threadId: string): Promise<SupportMessage[]> {
    try {
      const data = await apiFetch<SupportMessage[]>('/support/messages', {
        query: { thread_id: threadId },
      });
      if (Array.isArray(data)) {
        // Sinkronkan cache lokal dengan data server
        const local = getLocalMessages();
        const map = new Map<string, SupportMessage>();
        local.forEach((m) => map.set(m.id, m));
        data.forEach((m) => map.set(m.id, m));
        saveLocalMessages(Array.from(map.values()));
        return data;
      }
      return [];
    } catch {
      // Fallback local persistence
      const all = getLocalMessages();
      const map = new Map<string, SupportMessage>();
      (Array.isArray(all) ? all : [])
        .filter((m) => m && (m.threadId === threadId || (!m.threadId && threadId === 'USER_THREAD')))
        .forEach((m) => map.set(m.id, m));
      return Array.from(map.values()).sort((a, b) =>
        (a.createdAt || '').localeCompare(b.createdAt || '')
      );
    }
  },

  /**
   * Mengambil daftar Admin DPW dan opsi Tim Standby untuk tujuan chat pengurus
   */
  async getSupportAdmins(): Promise<AdminTargetOption[]> {
    const defaultTeam: AdminTargetOption = {
      id: 'ALL_DPW',
      name: 'Tim Admin DPW Standby (Rekomendasi)',
      role: 'SUPER_ADMIN',
      jabatan: 'Seluruh Admin DPW yang sedang aktif (Respon Cepat)',
      isDefaultTeam: true,
    };

    try {
      const res = await apiFetch<AdminTargetOption[]>('/support/admins');
      if (Array.isArray(res) && res.length > 0) {
        return [defaultTeam, ...res];
      }
    } catch {
      /* offline fallback */
    }

    return [
      defaultTeam,
      {
        id: '7106033003050001',
        nik: '7106033003050001',
        name: 'Super Administrator Utama DPW',
        role: 'SUPER_ADMIN',
        jabatan: 'Super Administrator DPW Partai NasDem Sulut',
      },
    ];
  },

  /**
   * Mengirim pesan baru
   */
  async sendMessage(
    payload: SendMessagePayload,
    session: UserSession,
    targetThreadId?: string
  ): Promise<SupportMessage> {
    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const effectiveThreadId =
      targetThreadId || session.adminNik || session.adminName || 'USER_THREAD';

    const recipientNik = isSuperAdmin
      ? payload.recipientNik
      : payload.recipientNik || 'ALL_DPW';
    const recipientName =
      payload.recipientName ||
      (recipientNik === 'ALL_DPW' ? 'Tim Admin DPW Standby' : undefined);

    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      threadId: effectiveThreadId,
      senderNik: session.adminNik || (isSuperAdmin ? 'SUPERADMIN' : 'PENGURUS'),
      senderName: session.adminName,
      senderRole: session.role,
      senderDpd: session.dpdAccess,
      senderDpc: session.dpcAccess,
      senderDprt: session.dprtAccess,
      senderJabatan: session.jabatan,
      recipientRole: isSuperAdmin ? 'PENGURUS' : 'SUPER_ADMIN',
      recipientNik,
      recipientName,
      category: payload.category || 'UMUM',
      message: payload.message.trim(),
      attachmentUrl: payload.attachmentUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    let resultMsg: SupportMessage = newMessage;
    try {
      const res = await apiFetch<SupportMessage>('/support/messages', {
        method: 'POST',
        body: newMessage,
      });
      if (res && res.id) {
        resultMsg = res;
      }
    } catch {
      // Offline fallback: tetap gunakan newMessage
    }

    // Simpan ke local storage dengan deduplikasi
    const local = getLocalMessages();
    local.push(resultMsg);
    saveLocalMessages(local);

    // Picu event realtime instan ke semua tab & listener
    notifyRealtimeUpdate({ type: 'NEW_MESSAGE', threadId: effectiveThreadId });
    return resultMsg;
  },

  /**
   * Khusus Super Admin: Mengambil daftar seluruh thread percakapan pengurus
   */
  async getThreads(): Promise<SupportThread[]> {
    try {
      const data = await apiFetch<SupportThread[]>('/support/threads');
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      // Agregasi lokal thread dari local storage
      const all = getLocalMessages();
      const threadMap = new Map<string, SupportMessage[]>();

      all.forEach((msg) => {
        const list = threadMap.get(msg.threadId) || [];
        list.push(msg);
        threadMap.set(msg.threadId, list);
      });

      const threads: SupportThread[] = [];
      threadMap.forEach((msgs, threadId) => {
        msgs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const lastMsg = msgs[0];
        const firstPengurusMsg = msgs.find((m) => m.senderRole !== 'SUPER_ADMIN') || lastMsg;

        const unreadCount = msgs.filter((m) => m.recipientRole === 'SUPER_ADMIN' && !m.isRead).length;

        threads.push({
          threadId,
          pengurusNik: firstPengurusMsg.senderNik,
          pengurusName: firstPengurusMsg.senderName,
          pengurusRole: firstPengurusMsg.senderRole,
          pengurusDpd: firstPengurusMsg.senderDpd || 'Sulawesi Utara',
          pengurusDpc: firstPengurusMsg.senderDpc,
          pengurusDprt: firstPengurusMsg.senderDprt,
          pengurusJabatan: firstPengurusMsg.senderJabatan,
          lastMessage: lastMsg.message,
          lastMessageTime: lastMsg.createdAt,
          category: lastMsg.category,
          recipientNik: lastMsg.recipientNik,
          recipientName: lastMsg.recipientName,
          unreadCount,
        });
      });

      return threads.sort((a, b) => b.lastMessageTime.localeCompare(a.lastMessageTime));
    }
  },

  /**
   * Menandai pesan di suatu thread telah dibaca
   */
  async markAsRead(threadId: string, role: string): Promise<void> {
    try {
      await apiFetch('/support/read', {
        method: 'POST',
        body: { thread_id: threadId, role },
      });
    } catch {
      /* abaikan */
    }

    // Update lokal
    const all = getLocalMessages();
    let hasChanged = false;
    const updated = all.map((m) => {
      if (m.threadId === threadId) {
        if (role === 'SUPER_ADMIN' && m.recipientRole === 'SUPER_ADMIN' && !m.isRead) {
          hasChanged = true;
          return { ...m, isRead: true };
        }
        if (role !== 'SUPER_ADMIN' && m.recipientRole === 'PENGURUS' && !m.isRead) {
          hasChanged = true;
          return { ...m, isRead: true };
        }
      }
      return m;
    });

    if (hasChanged) {
      saveLocalMessages(updated);
      notifyRealtimeUpdate({ type: 'READ_UPDATE', threadId });
    }
  },

  /**
   * Mengirim notifikasi realtime bahwa pengguna sedang mengetik
   */
  sendTyping(threadId: string, senderName: string, senderRole: string): void {
    notifyRealtimeUpdate({
      type: 'TYPING',
      threadId,
      senderName,
      senderRole,
    });
  },

  /**
   * Berlangganan event real-time (pesan baru / status baca / sedang mengetik) lintas tab & dalam aplikasi
   */
  subscribe(callback: (event: SupportChatEvent) => void): () => void {
    const handleCustom = (e: any) => {
      if (e?.detail) callback(e.detail);
    };

    const handleBroadcast = (e: MessageEvent) => {
      if (e?.data) callback(e.data);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nasdem_chat_event', handleCustom);
    }
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('nasdem_chat_event', handleCustom);
      }
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
    };
  },
};

