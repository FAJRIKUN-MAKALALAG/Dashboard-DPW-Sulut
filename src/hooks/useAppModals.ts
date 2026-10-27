import { useState } from 'react';
import { Member } from '../types';

export function useAppModals() {
  const [isTemplateHubOpen, setIsTemplateHubOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Deletion requests state & modals
  const [isDeletionApprovalOpen, setIsDeletionApprovalOpen] = useState(false);
  const [isDeletionRequestOpen, setIsDeletionRequestOpen] = useState(false);
  const [deletionTargetMember, setDeletionTargetMember] = useState<Member | null>(null);

  // User Management modal (Super Admin exclusive)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Referral Hub Modal (Kode Referral & Rekrutmen Pengurus)
  const [isReferralHubOpen, setIsReferralHubOpen] = useState(false);

  const openDetailModal = (member: Member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMember(null);
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMember(null);
  };

  const openStatusModal = (member: Member) => {
    setSelectedMember(member);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedMember(null);
  };

  const openCardModal = (member: Member) => {
    setSelectedMember(member);
    setIsCardModalOpen(true);
  };

  const closeCardModal = () => {
    setIsCardModalOpen(false);
    setSelectedMember(null);
  };

  const openDeletionRequest = (member: Member) => {
    setDeletionTargetMember(member);
    setIsDeletionRequestOpen(true);
  };

  const closeDeletionRequest = () => {
    setIsDeletionRequestOpen(false);
    setDeletionTargetMember(null);
  };

  return {
    isTemplateHubOpen,
    setIsTemplateHubOpen,
    isPrintReportOpen,
    setIsPrintReportOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isStatusModalOpen,
    setIsStatusModalOpen,
    isCardModalOpen,
    setIsCardModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isRoleModalOpen,
    setIsRoleModalOpen,
    isAuditModalOpen,
    setIsAuditModalOpen,
    selectedMember,
    setSelectedMember,
    isDeletionApprovalOpen,
    setIsDeletionApprovalOpen,
    isDeletionRequestOpen,
    setIsDeletionRequestOpen,
    deletionTargetMember,
    setDeletionTargetMember,
    isUserManagementOpen,
    setIsUserManagementOpen,
    isReferralHubOpen,
    setIsReferralHubOpen,
    // Helper actions
    openDetailModal,
    closeDetailModal,
    openEditModal,
    closeEditModal,
    openStatusModal,
    closeStatusModal,
    openCardModal,
    closeCardModal,
    openDeletionRequest,
    closeDeletionRequest,
  };
}

export type AppModalsState = ReturnType<typeof useAppModals>;
