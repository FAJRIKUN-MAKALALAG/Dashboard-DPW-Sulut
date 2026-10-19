export const APP_CONFIG = {
  name: 'Dashboard DPW Partai NasDem Sulawesi Utara',
  shortName: 'DPW NasDem Sulut',
  provinceName: 'Sulawesi Utara',
  provinceCode: '71',
  defaultTheme: 'light',
  storageKeys: {
    theme: 'sulut_ekta_theme',
    authenticated: 'nasdem_sulut_authenticated',
    members: 'sulut_ekta_members',
    auditLogs: 'sulut_ekta_audit_logs',
    deletionRequests: 'sulut_ekta_deletion_requests',
    session: 'sulut_ekta_session',
  },
} as const;
