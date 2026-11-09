import { Member, UserSession } from '../../types';

export interface UseTerritorialMatrixProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  selectedDpd: string;
  selectedDpc: string;
  selectedDprt: string;
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[], obsoleteNiks?: string[]) => void;
  onDeleteMembersBatch?: (niksToDelete: string[], territoryLabel: string) => void;
}

