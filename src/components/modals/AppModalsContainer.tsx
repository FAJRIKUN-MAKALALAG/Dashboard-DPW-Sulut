import React from 'react';
import { Member, UserSession, AuditLog, DeletionRequest, MemberStatus } from '../../types';
import { AppModalsState } from '../../hooks/useAppModals';
import {
  AddMemberModal,
  EditMemberModal,
  MemberDetailModal,
  EKtaCardModal,
  StatusChangeModal,
  DeletionRequestModal,
  DeletionApprovalModal,
  RoleSwitcherModal,
  AuditTrailModal,
  ExecutiveReportPrintModal,
  UserManagementModal,
} from './index';
import { TemplateDownloadHubModal } from '../territorial/TemplateDownloadHubModal';
import { ReferralHubModal } from '../referral/ReferralHubModal';

interface AppModalsContainerProps {
  modals: AppModalsState;
  members: Member[];
  auditLogs: AuditLog[];
  deletionRequests: DeletionRequest[];
  session: UserSession;
  onSelectSession: (s: UserSession) => void;
  onAddMember: (m: Member) => void;
  onEditMember: (m: Member, originalNik: string) => void;
  onSaveStatus: (nik: string, newStatus: MemberStatus, reason: string) => void;
  onSubmitDeletionRequest: (member: Member, reason: string) => void;
  onApproveDeletionRequest: (requestId: string, notes?: string) => void;
  onRejectDeletionRequest: (requestId: string, notes: string) => void;
  onRecordAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  onNavigateToTerritory: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onClearAuditLogs?: () => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  modals,
  members,
  auditLogs,
  deletionRequests,
  session,
  onSelectSession,
  onAddMember,
  onEditMember,
  onSaveStatus,
  onSubmitDeletionRequest,
  onApproveDeletionRequest,
  onRejectDeletionRequest,
  onRecordAuditLog,
  onNavigateToTerritory,
  onClearAuditLogs,
}) => {
  return (
    <>
      <TemplateDownloadHubModal
        isOpen={modals.isTemplateHubOpen}
        onClose={() => modals.setIsTemplateHubOpen(false)}
        session={session}
        onOpenTerritorialMatrix={(dpd, dpc, level) => {
          modals.setIsTemplateHubOpen(false);
          onNavigateToTerritory(dpd, dpc, level);
        }}
      />

      <ExecutiveReportPrintModal
        isOpen={modals.isPrintReportOpen}
        onClose={() => modals.setIsPrintReportOpen(false)}
        members={members}
      />

      <StatusChangeModal
        isOpen={modals.isStatusModalOpen}
        onClose={modals.closeStatusModal}
        member={modals.selectedMember}
        session={session}
        onSaveStatus={onSaveStatus}
      />

      {modals.isAddModalOpen && (
        <AddMemberModal
          isOpen={modals.isAddModalOpen}
          onClose={() => modals.setIsAddModalOpen(false)}
          onAdd={onAddMember}
          existingMembers={members}
          session={session}
        />
      )}

      {modals.isEditModalOpen && modals.selectedMember && (
        <EditMemberModal
          isOpen={modals.isEditModalOpen}
          onClose={modals.closeEditModal}
          onSave={onEditMember}
          member={modals.selectedMember}
          existingMembers={members}
          session={session}
        />
      )}

      {modals.isCardModalOpen && modals.selectedMember && (
        <EKtaCardModal
          isOpen={modals.isCardModalOpen}
          member={modals.selectedMember}
          onClose={modals.closeCardModal}
        />
      )}

      {session?.role === 'SUPER_ADMIN' && (
        <RoleSwitcherModal
          isOpen={modals.isRoleModalOpen}
          onClose={() => modals.setIsRoleModalOpen(false)}
          currentSession={session}
          onSelectSession={onSelectSession}
        />
      )}

      <AuditTrailModal
        isOpen={modals.isAuditModalOpen}
        onClose={() => modals.setIsAuditModalOpen(false)}
        logs={auditLogs}
        session={session}
        onClearLogs={onClearAuditLogs}
      />

      <MemberDetailModal
        isOpen={modals.isDetailModalOpen}
        onClose={modals.closeDetailModal}
        member={modals.selectedMember}
        session={session}
        onUpdateMember={(updated) => {
          onEditMember(updated, updated.nik);
        }}
        onOpenEdit={(m) => {
          modals.openEditModal(m);
        }}
        onOpenStatusChange={(m) => {
          modals.openStatusModal(m);
        }}
        onOpenCardModal={(m) => {
          modals.openCardModal(m);
        }}
      />

      <DeletionRequestModal
        isOpen={modals.isDeletionRequestOpen}
        onClose={modals.closeDeletionRequest}
        member={modals.deletionTargetMember}
        session={session}
        onSubmitRequest={onSubmitDeletionRequest}
      />

      <DeletionApprovalModal
        isOpen={modals.isDeletionApprovalOpen}
        onClose={() => modals.setIsDeletionApprovalOpen(false)}
        requests={deletionRequests}
        session={session}
        onApprove={onApproveDeletionRequest}
        onReject={onRejectDeletionRequest}
      />

      <UserManagementModal
        isOpen={modals.isUserManagementOpen}
        onClose={() => modals.setIsUserManagementOpen(false)}
        members={members}
        session={session}
        onRecordAudit={onRecordAuditLog}
      />

      <ReferralHubModal
        isOpen={modals.isReferralHubOpen}
        onClose={() => modals.setIsReferralHubOpen(false)}
        session={session}
      />
    </>
  );
};
