import { apiFetch } from './http';

export interface AdminPanelRoleCategoryCounts {
  superAdmin: number;
  ketua: number;
  adminDelegasi: number;
  pengurus: number;
  anggotaKhusus: number;
}

export interface AdminPanelSlotLevelStats {
  total: number;
  filled: number;
  vacant: number;
}

export interface AdminPanelDpdSummary {
  dpd: string;
  total: number;
  pengurus: number;
  anggotaBiasa: number;
  aktif: number;
}

export interface AdminPanelTelemetry {
  serverTime: string;
  sessions: {
    onlineWindowMinutes: number;
    onlineNow: number;
    activeToday: number;
    totalAccounts: number;
    activeAccounts: number;
    inactiveAccounts: number;
    onlineByCategory: AdminPanelRoleCategoryCounts;
    accountsByCategory: AdminPanelRoleCategoryCounts;
  };
  members: {
    total: number;
    pengurus: number;
    anggotaBiasa: number;
    aktif: number;
    nonAktif: number;
    meninggal: number;
    mundurPindahPartai: number;
    pindahDomisili: number;
    withEkta: number;
    withoutEkta: number;
    withKtpPhoto: number;
    withProfilePhoto: number;
    joinedToday: number;
    joinedLast7Days: number;
    joinedLast30Days: number;
    viaReferral: number;
  };
  territories: {
    dpdCount: number;
    dpcCount: number;
    dprtCount: number;
    positionsTotal: number;
    positionsByLevel: {
      DPW: number;
      DPD: number;
      DPC: number;
      DPRt: number;
    };
    slots: {
      total: number;
      filled: number;
      vacant: number;
      fillRate: number;
      byLevel: {
        DPW: AdminPanelSlotLevelStats;
        DPD: AdminPanelSlotLevelStats;
        DPC: AdminPanelSlotLevelStats;
        DPRt: AdminPanelSlotLevelStats;
      };
    };
    perDpd: AdminPanelDpdSummary[];
  };
  records: {
    auditLogs: {
      total: number;
      today: number;
      last7Days: number;
      byAction: Record<string, number>;
    };
    deletionRequests: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    supportChat: {
      totalMessages: number;
      totalThreads: number;
      unreadMessages: number;
    };
    inventory: {
      totalItems: number;
      totalUnits: number;
      baik: number;
      perbaikan: number;
      rusak: number;
      byFloor: Record<string, number>;
    };
  };
  database: {
    tables: {
      members: number;
      positions: number;
      structure_slots: number;
      app_users: number;
      audit_logs: number;
      deletion_requests: number;
      support_messages: number;
      inventory_items: number;
    };
    totalRecordsNonFinance: number;
  };
}

export const AdminPanelService = {
  /** Mengambil seluruh metrik angka real-time non-keuangan (khusus SUPER_ADMIN). */
  async getTelemetry(fresh = false): Promise<AdminPanelTelemetry> {
    return apiFetch<AdminPanelTelemetry>(fresh ? '/stats/admin-panel?fresh=1' : '/stats/admin-panel');
  },
};
