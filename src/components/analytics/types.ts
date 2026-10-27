import { Member } from '../../types';

export type AnalyticsScreenId =
  | 'grid'
  | 'column15'
  | 'drilldown'
  | 'composition'
  | 'leaderboard'
  | 'zones'
  | 'status_gender';

export interface KabKotaConfig {
  key: string;
  name: string;
  label: string;
  zone: string;
}

export const SULUT_15_KABKOTA: KabKotaConfig[] = [
  { key: 'bolmong', name: 'BOLAANG MONGONDOW', label: 'Bolaang Mongondow', zone: 'BMR' },
  { key: 'bolsel', name: 'BOLAANG MONGONDOW SELATAN', label: 'Bolaang Mongondow Selatan', zone: 'BMR' },
  { key: 'boltim', name: 'BOLAANG MONGONDOW TIMUR', label: 'Bolaang Mongondow Timur', zone: 'BMR' },
  { key: 'bolmut', name: 'BOLAANG MONGONDOW UTARA', label: 'Bolaang Mongondow Utara', zone: 'BMR' },
  { key: 'sitaro', name: 'KEP. SIAU TAGULANDANG BIARO', label: 'Kep. Siau Tagulandang Biaro', zone: 'Kepulauan' },
  { key: 'sangihe', name: 'KEPULAUAN SANGIHE', label: 'Kepulauan Sangihe', zone: 'Kepulauan' },
  { key: 'talaud', name: 'KEPULAUAN TALAUD', label: 'Kepulauan Talaud', zone: 'Kepulauan' },
  { key: 'bitung', name: 'KOTA BITUNG', label: 'Kota Bitung', zone: 'Daratan Minahasa' },
  { key: 'kotamobagu', name: 'KOTA KOTAMOBAGU', label: 'Kota Kotamobagu', zone: 'BMR' },
  { key: 'manado', name: 'KOTA MANADO', label: 'Kota Manado', zone: 'Daratan Minahasa' },
  { key: 'tomohon', name: 'KOTA TOMOHON', label: 'Kota Tomohon', zone: 'Daratan Minahasa' },
  { key: 'minahasa', name: 'MINAHASA', label: 'Minahasa', zone: 'Daratan Minahasa' },
  { key: 'minsel', name: 'MINAHASA SELATAN', label: 'Minahasa Selatan', zone: 'Daratan Minahasa' },
  { key: 'mitra', name: 'MINAHASA TENGGARA', label: 'Minahasa Tenggara', zone: 'Daratan Minahasa' },
  { key: 'minut', name: 'MINAHASA UTARA', label: 'Minahasa Utara', zone: 'Daratan Minahasa' },
];

export interface KabKotaAnalyticsItem {
  key: string;
  name: string;
  label: string;
  zone: string;
  total: number;
  active: number;
  pengurus: number;
  anggota: number;
  withKta: number;
  officialDpcCount: number;
  officialDprtCount: number;
  percentage: number;
  subdistrictsMap: Map<string, number>;
}

export interface ZoneSummary {
  name: string;
  description: string;
  color: string;
  regions: KabKotaAnalyticsItem[];
  total: number;
  dpcTotal: number;
  dprtTotal: number;
}

export interface AnalyticsData {
  totalMembers: number;
  pengurusCount: number;
  anggotaBiasaCount: number;
  activeCount: number;
  inactiveCount: number;
  withKtaCount: number;
  verifiedKtpCount: number;
  maleCount: number;
  femaleCount: number;
  unspecGenderCount: number;
  totalDpdOfficial: number;
  totalDpcOfficial: number;
  totalDprtOfficial: number;
  coveredDpcCount: number;
  coveredDprtCount: number;
  kabKotaList: KabKotaAnalyticsItem[];
  chartBars: KabKotaAnalyticsItem[];
  maxChartValue: number;
  topPerformer?: KabKotaAnalyticsItem;
  leaderboard: KabKotaAnalyticsItem[];
  zones: ZoneSummary[];
}

export interface SubdistrictDrilldownItem {
  name: string;
  count: number;
  percentage: number;
  dprtCount: number;
}

export interface DrilldownData {
  dpdName: string;
  totalCount: number;
  pengurusCount: number;
  anggotaCount: number;
  officialDpcCount: number;
  officialDprtCount: number;
  subdistricts: SubdistrictDrilldownItem[];
  maxSubCount: number;
}
