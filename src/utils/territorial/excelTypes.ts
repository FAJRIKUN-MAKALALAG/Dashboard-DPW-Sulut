import { Member } from '../../types';

export interface TerritoryContext {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  dpd: string;
  dpc?: string;
  dprt?: string;
}

export interface ParsedTerritoryRow {
  no: number;
  dpd?: string;
  subOrg: string;
  jabatanExcel: string;
  jabatanMatched?: string;
  isMatched: boolean;
  namaLengkap: string;
  nik: string;
  nomorEKTA: string;
  jenisKelamin: string;
  nomorHP: string;
  email: string;
  alamat?: string;
  status: string;
  isFilled: boolean;
  aiNote?: string;
  isVacantSlot?: boolean;
}

export interface DpdImportComplianceInfo {
  totalRequired: number; // 36
  filledCount: number;
  vacantCount: number;
  isComplete: boolean;
  vacantSlots: Array<{ no: number; jabatan: string; subOrg: string }>;
  filledSlots: Array<{ no: number; jabatan: string; namaLengkap: string }>;
}

export interface ParseTerritoryExcelResult {
  territoryContext: TerritoryContext;
  rows: ParsedTerritoryRow[];
  membersToSave: Member[];
  stats: {
    totalRows: number;
    filledRows: number;
    emptyRows: number;
    matchedPositions: number;
    customPositions: number;
  };
  filename: string;
  dpdPimpinanCompliance?: DpdImportComplianceInfo;
}

export interface AiTemplateCheckStats {
  totalRows: number;
  filledRows: number;
  vacantSlotsCount: number;
  standardSlotsTarget: number;
  extraRowsCount: number;
  pertimbanganCount: number;
  pakarCount: number;
  pimpinanCount: number;
  matchedCount: number;
}

export interface AiTemplateCheckResult {
  success: boolean;
  rows: ParsedTerritoryRow[];
  membersToSave: Member[];
  stats: AiTemplateCheckStats;
  message: string;
  dpdPimpinanCompliance?: DpdImportComplianceInfo;
}
