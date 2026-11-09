import { Member, UserSession } from '../../types';

export type ExportScopeMode =
  | 'DPW'
  | 'DPD'
  | 'DPC'
  | 'DPRt'
  | 'ALL_KADER'
  | 'STATISTICS';

export interface ExecutiveReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  session?: UserSession;
  initialDpd?: string;
  initialReportType?: 'STATISTICS' | 'NOMINATIVE';
  customSelectedMembers?: Member[] | null;
  customTitleContext?: string;
}

