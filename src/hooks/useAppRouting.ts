import { useState, useEffect, useRef, useCallback } from 'react';
import { MainNavTab } from '../components/layout/AppSidebar';
import { UserSession, MemberStatus } from '../types';
import {
  canAccessDashboard,
  canAccessAnalytics,
  canAccessStructureTab,
  getDefaultActiveTab,
} from '../utils/permissionUtils';

export const VALID_MAIN_TABS: MainNavTab[] = [
  'dashboard',
  'analytics',
  'portal',
  'dpw',
  'dpd',
  'dpc',
  'dprt',
  'members',
];

export interface ParsedRouteParams {
  tab: MainNavTab | null;
  dpd?: string;
  dpc?: string;
  dprt?: string;
  statusFilter?: MemberStatus;
  membershipFilter?: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  cleanScreen?: string | null;
  isClean?: boolean;
}

/**
 * Membaca & mem-parsing query parameter dari window.location.search
 */
export function parseCurrentRoute(): ParsedRouteParams {
  if (typeof window === 'undefined') {
    return { tab: null };
  }
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get('tab');
  const dpd = params.get('dpd') || params.get('wilayah') || undefined;
  const dpc = params.get('dpc') || params.get('kecamatan') || undefined;
  const dprt = params.get('dprt') || params.get('desa') || params.get('ranting') || undefined;
  const rawStatus = params.get('status');
  const rawMembership = params.get('membership')?.toUpperCase();
  const cleanScreen = params.get('screen');
  const isClean = params.get('clean') === 'true';

  let tab: MainNavTab | null = null;
  if (rawTab && (VALID_MAIN_TABS as string[]).includes(rawTab)) {
    tab = rawTab as MainNavTab;
  }

  let statusFilter: MemberStatus | undefined = undefined;
  if (rawStatus && ['Aktif', 'Pending', 'Tidak Aktif'].includes(rawStatus)) {
    statusFilter = rawStatus as MemberStatus;
  }

  let membershipFilter: 'ALL' | 'PENGURUS' | 'ANGGOTA' | undefined = undefined;
  if (rawMembership && ['ALL', 'PENGURUS', 'ANGGOTA'].includes(rawMembership)) {
    membershipFilter = rawMembership as 'ALL' | 'PENGURUS' | 'ANGGOTA';
  }

  return {
    tab,
    dpd: dpd?.trim() || undefined,
    dpc: dpc?.trim() || undefined,
    dprt: dprt?.trim() || undefined,
    statusFilter,
    membershipFilter,
    cleanScreen,
    isClean,
  };
}

/**
 * Validasi apakah peran user memiliki izin untuk membuka tab tersebut
 */
export function isTabPermitted(tab: MainNavTab, session?: UserSession): boolean {
  if (!session) return true;
  if (session.role === 'ANGGOTA') {
    return tab === 'portal';
  }
  switch (tab) {
    case 'dashboard':
      return canAccessDashboard(session);
    case 'analytics':
      return canAccessAnalytics(session);
    case 'dpw':
      return canAccessStructureTab('dpw', session);
    case 'dpd':
      return canAccessStructureTab('dpd', session);
    case 'dpc':
      return canAccessStructureTab('dpc', session);
    case 'dprt':
      return canAccessStructureTab('dprt', session);
    case 'portal':
    case 'members':
      return true;
    default:
      return true;
  }
}

/**
 * Membentuk query string URL dari state navigasi aktif
 */
export function buildQueryString(params: {
  tab: MainNavTab;
  dpd?: string;
  dpc?: string;
  dprt?: string;
  statusFilter?: MemberStatus;
  membershipFilter?: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  clean?: boolean;
  screen?: string | null;
}): string {
  const q = new URLSearchParams();

  // Pertahankan mode clean / multi-screen video wall bila ada
  if (params.clean) q.set('clean', 'true');
  if (params.screen) q.set('screen', params.screen);

  q.set('tab', params.tab);

  if (params.tab === 'dpd') {
    if (params.dpd && params.dpd !== 'ALL' && params.dpd !== 'Sulawesi Utara') {
      q.set('dpd', params.dpd);
    }
  } else if (params.tab === 'dpc') {
    if (params.dpd && params.dpd !== 'ALL' && params.dpd !== 'Sulawesi Utara') {
      q.set('dpd', params.dpd);
    }
    if (params.dpc && params.dpc !== 'ALL' && params.dpc !== 'Umum (DPD)') {
      q.set('dpc', params.dpc);
    }
  } else if (params.tab === 'dprt') {
    if (params.dpd && params.dpd !== 'ALL') q.set('dpd', params.dpd);
    if (params.dpc && params.dpc !== 'ALL') q.set('dpc', params.dpc);
    if (params.dprt && params.dprt !== 'ALL') q.set('dprt', params.dprt);
  } else if (params.tab === 'members') {
    if (params.dpd && params.dpd !== 'ALL') q.set('dpd', params.dpd);
    if (params.statusFilter) q.set('status', params.statusFilter);
    if (params.membershipFilter && params.membershipFilter !== 'ALL') {
      q.set('membership', params.membershipFilter);
    }
  }

  const str = q.toString();
  return str ? `?${str}` : '';
}

/**
 * Membandingkan dua query string secara semantik (mengabaikan urutan & encoding + vs %20)
 */
export function areQueryStringsEquivalent(q1: string, q2: string): boolean {
  if (q1 === q2) return true;
  const p1 = new URLSearchParams(q1);
  const p2 = new URLSearchParams(q2);
  const keys1 = Array.from(p1.keys());
  const keys2 = Array.from(p2.keys());
  if (keys1.length !== keys2.length) return false;
  for (const k of keys1) {
    if (p1.get(k) !== p2.get(k)) return false;
  }
  return true;
}

/**
 * Format judul halaman browser (document.title)
 */
export function formatDocumentTitle(
  tab: MainNavTab,
  dpd?: string,
  dpc?: string,
  dprt?: string
): string {
  const baseSuffix = 'DPW Partai NasDem Sulut';
  switch (tab) {
    case 'dashboard':
      return `Dashboard Utama — ${baseSuffix}`;
    case 'analytics':
      return `Executive Analytics — ${baseSuffix}`;
    case 'portal':
      return `Portal Mandiri Pengurus — ${baseSuffix}`;
    case 'dpw':
      return `Struktur DPW Sulawesi Utara — ${baseSuffix}`;
    case 'dpd':
      return `${dpd || 'Struktur DPD'} — ${baseSuffix}`;
    case 'dpc':
      return `DPC ${dpc || 'Kecamatan'}${dpd ? ` (${dpd})` : ''} — ${baseSuffix}`;
    case 'dprt':
      return `DPRt ${dprt || 'Desa'}${dpc ? ` (${dpc})` : ''} — ${baseSuffix}`;
    case 'members':
      return `${dpd ? `Kader ${dpd}` : 'Database Kader'} — ${baseSuffix}`;
    default:
      return baseSuffix;
  }
}

interface UseAppRoutingProps {
  session?: UserSession;
  isAuthenticated: boolean;
}

export function useAppRouting({ session, isAuthenticated }: UseAppRoutingProps) {
  // 1. Initial State from URL
  const initialRoute = parseCurrentRoute();

  const [activeTab, setActiveTabState] = useState<MainNavTab>(() => {
    if (initialRoute.tab && isTabPermitted(initialRoute.tab, session)) {
      return initialRoute.tab;
    }
    return getDefaultActiveTab(session);
  });

  const [matrixInitialDpd, setMatrixInitialDpd] = useState<string | undefined>(() => {
    if (session?.dpdAccess && session.dpdAccess !== 'ALL') return session.dpdAccess;
    return initialRoute.dpd;
  });

  const [matrixInitialDpc, setMatrixInitialDpc] = useState<string | undefined>(() => {
    if (
      (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') &&
      session?.dpcAccess &&
      session?.dpcAccess !== 'ALL' &&
      session?.dpcAccess !== 'Umum (DPD)'
    ) {
      return session.dpcAccess;
    }
    return initialRoute.dpc;
  });

  const [matrixInitialDprt, setMatrixInitialDprt] = useState<string | undefined>(() => {
    if (
      session?.role === 'ADMIN_DPRT' &&
      session?.dprtAccess &&
      session?.dprtAccess !== 'ALL' &&
      session?.dprtAccess !== 'Pusat/Umum'
    ) {
      return session.dprtAccess;
    }
    return initialRoute.dprt;
  });

  // Filters for member database
  const [navDpdFilter, setNavDpdFilter] = useState<string | undefined>(initialRoute.dpd);
  const [navStatusFilter, setNavStatusFilter] = useState<MemberStatus | undefined>(
    initialRoute.statusFilter
  );
  const [navMembershipFilter, setNavMembershipFilter] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>(
    initialRoute.membershipFilter || 'ALL'
  );

  // Clean Screen flags
  const [cleanScreenParam] = useState<string | null>(initialRoute.cleanScreen || null);
  const [isCleanMode] = useState<boolean>(Boolean(initialRoute.isClean));

  // Refs to control history behavior
  const isPopStateRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);
  const prevTabRef = useRef<MainNavTab>(initialRoute.tab || getDefaultActiveTab(session));
  const sessionRef = useRef<UserSession | undefined>(session);
  sessionRef.current = session;

  // 2. Tab Navigation Setter
  const setActiveTab = useCallback((tab: MainNavTab) => {
    setActiveTabState(tab);
  }, []);

  // 3. Navigation from Dashboard Widgets
  const handleNavigateFromDashboard = useCallback(
    (
      filterDpd?: string,
      filterStatus?: MemberStatus,
      filterMembership: 'ALL' | 'PENGURUS' | 'ANGGOTA' = 'ALL'
    ) => {
      setNavDpdFilter(filterDpd);
      setNavStatusFilter(filterStatus);
      setNavMembershipFilter(filterMembership);
      setActiveTabState('members');
    },
    []
  );

  // 4. Territory Navigation Handler
  const handleNavigateToTerritory = useCallback(
    (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => {
      if (level === 'DPW') {
        setActiveTabState('dpw');
      } else if (level === 'DPRt') {
        if (dpd) setMatrixInitialDpd(dpd);
        if (dpc) setMatrixInitialDpc(dpc);
        setActiveTabState('dprt');
      } else if (level === 'DPC' || dpc) {
        if (dpd) setMatrixInitialDpd(dpd);
        if (dpc) setMatrixInitialDpc(dpc);
        setActiveTabState('dpc');
      } else if (level === 'DPD' || dpd) {
        if (dpd) setMatrixInitialDpd(dpd);
        setActiveTabState('dpd');
      } else {
        setActiveTabState('dpd');
      }
    },
    []
  );

  // 5. Territory change inside TerritorialStructurePage (dropdown select)
  const handleTerritoryChange = useCallback(
    (dpd: string, dpc?: string, dprt?: string) => {
      setMatrixInitialDpd((prev) => (prev !== dpd ? dpd : prev));
      if (dpc !== undefined) {
        setMatrixInitialDpc((prev) => (prev !== dpc ? dpc : prev));
      }
      if (dprt !== undefined) {
        setMatrixInitialDprt((prev) => (prev !== dprt ? dprt : prev));
      }
    },
    []
  );

  // 6. Two-Way Sync: React State -> Browser History (URL Bar)
  useEffect(() => {
    if (!isAuthenticated) return;

    const targetSearch = buildQueryString({
      tab: activeTab,
      dpd: matrixInitialDpd,
      dpc: matrixInitialDpc,
      dprt: matrixInitialDprt,
      statusFilter: activeTab === 'members' ? navStatusFilter : undefined,
      membershipFilter: activeTab === 'members' ? navMembershipFilter : undefined,
      clean: isCleanMode,
      screen: cleanScreenParam,
    });

    const newUrl = `${window.location.pathname}${targetSearch}${window.location.hash}`;
    const newTitle = formatDocumentTitle(
      activeTab,
      matrixInitialDpd,
      matrixInitialDpc,
      matrixInitialDprt
    );

    // Update document title
    if (typeof document !== 'undefined') {
      document.title = newTitle;
    }

    // Jika perubahan datang dari tombol Back/Forward browser, jangan buat history baru!
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }

    // Hindari duplikasi jika URL sudah setara secara semantik
    if (areQueryStringsEquivalent(window.location.search, targetSearch)) {
      return;
    }

    if (isInitialMountRef.current) {
      // Saat pertama kali load, normalize query tanpa menumpuk history baru
      window.history.replaceState({ tab: activeTab, dpd: matrixInitialDpd }, newTitle, newUrl);
      isInitialMountRef.current = false;
    } else {
      // Gunakan replaceState jika hanya melengkapi query wilayah di tab yang sama saat inisialisasi
      const prevSearch = new URLSearchParams(window.location.search);
      const isJustAddingTerritoryToBareTab = !prevSearch.get('dpd') && Boolean(matrixInitialDpd);

      if (isJustAddingTerritoryToBareTab && prevTabRef.current === activeTab) {
        window.history.replaceState({ tab: activeTab, dpd: matrixInitialDpd }, newTitle, newUrl);
      } else {
        window.history.pushState({ tab: activeTab, dpd: matrixInitialDpd }, newTitle, newUrl);
      }
    }
    prevTabRef.current = activeTab;
  }, [
    isAuthenticated,
    activeTab,
    matrixInitialDpd,
    matrixInitialDpc,
    matrixInitialDprt,
    navStatusFilter,
    navMembershipFilter,
    isCleanMode,
    cleanScreenParam,
  ]);

  // 7. Two-Way Sync: Browser History (Back / Forward) -> React State
  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
      const parsed = parseCurrentRoute();
      const currentSession = sessionRef.current;

      const fallbackTab = getDefaultActiveTab(currentSession);
      const nextTab =
        parsed.tab && isTabPermitted(parsed.tab, currentSession) ? parsed.tab : fallbackTab;

      prevTabRef.current = nextTab;
      setActiveTabState(nextTab);

      setMatrixInitialDpd(parsed.dpd);
      setNavDpdFilter(parsed.dpd);
      setMatrixInitialDpc(parsed.dpc);
      setMatrixInitialDprt(parsed.dprt);
      setNavStatusFilter(parsed.statusFilter);
      setNavMembershipFilter(parsed.membershipFilter || 'ALL');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return {
    activeTab,
    setActiveTab,
    matrixInitialDpd,
    setMatrixInitialDpd,
    matrixInitialDpc,
    setMatrixInitialDpc,
    matrixInitialDprt,
    setMatrixInitialDprt,
    navDpdFilter,
    setNavDpdFilter,
    navStatusFilter,
    setNavStatusFilter,
    navMembershipFilter,
    setNavMembershipFilter,
    cleanScreenParam,
    isCleanMode,
    handleNavigateToTerritory,
    handleNavigateFromDashboard,
    handleTerritoryChange,
  };
}

