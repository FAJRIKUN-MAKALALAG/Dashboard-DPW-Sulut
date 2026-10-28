import React, { useMemo } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { useMemberFilterLogic } from '../hooks/useMemberFilterLogic';
import { MemberFilterBar } from './members/MemberFilterBar';
import { MemberStatsCards } from './members/MemberStatsCards';
import { MemberTable } from './members/MemberTable';
import { exportMembersToExcel, exportMembersToCsv } from '../utils/excelUtils';
import { canAddMembers } from '../utils/permissionUtils';
import {
  ArrowLeft,
  FileDown,
  FileSpreadsheet,
  UserPlus,
} from 'lucide-react';

interface MemberManagementProps {
  members: Member[];
  session: UserSession;
  initialDpdFilter?: string;
  initialStatusFilter?: MemberStatus;
  initialMembershipFilter?: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  onOpenAddModal: () => void;
  onOpenStatusModal: (member: Member) => void;
  onOpenCardModal: (member: Member) => void;
  onOpenEditModal: (member: Member) => void;
  onOpenDetailModal: (member: Member) => void;
  onOpenDeletionRequest: (member: Member) => void;
  onDirectDelete: (member: Member) => void;
  onBackToDashboard?: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  session,
  initialDpdFilter,
  initialStatusFilter,
  initialMembershipFilter,
  onOpenAddModal,
  onOpenStatusModal,
  onOpenCardModal,
  onOpenEditModal,
  onOpenDetailModal,
  onOpenDeletionRequest,
  onDirectDelete,
  onBackToDashboard,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    searchCategory,
    setSearchCategory,
    selectedDpd,
    setSelectedDpd,
    selectedDpcFilter,
    setSelectedDpcFilter,
    selectedDprtFilter,
    setSelectedDprtFilter,
    selectedStatus,
    setSelectedStatus,
    selectedRole,
    setSelectedRole,
    membershipFilter,
    setMembershipFilter,
    selectedCouncilFilter,
    setSelectedCouncilFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    dpdOptionsWithCount,
    activeRegion,
    availableDpcOptions,
    availableDprtOptions,
    availableRolesWithCount,
    countPengurusScope,
    countAnggotaScope,
    countPertimbanganScope,
    countPakarScope,
    countPimpinanScope,
    filteredMembers,
    paginatedMembers,
    totalPages,
  } = useMemberFilterLogic({
    members,
    session,
    initialDpdFilter,
    initialStatusFilter,
    initialMembershipFilter,
    pageSize: 15,
  });

  const activeFilteredCount = useMemo(
    () => filteredMembers.filter((m) => m.status === 'Aktif').length,
    [filteredMembers]
  );
  const nonActiveFilteredCount = filteredMembers.length - activeFilteredCount;
  const territoryScopedTotal = countPengurusScope + countAnggotaScope;

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 rounded-xl shadow-2xs transition-colors">
        <div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="btn-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs mb-2.5 self-start"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Kembali ke Dashboard Utama</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Modul Manajemen Kader NasDem
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              DPW Partai NasDem Sulut
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Daftar & Pembaruan Status e-KTA Kader NasDem
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Data keanggotaan teritorial Partai NasDem di 15 DPD se-Sulawesi Utara. Gunakan filter DPD, status, atau jabatan untuk pencarian cepat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              exportMembersToCsv(
                filteredMembers,
                `EKSPOR_KADER_SULUT_${selectedDpd !== 'ALL' ? selectedDpd : 'SEMUA'}.csv`
              )
            }
            className="btn-white flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer"
            title="Ekspor daftar kader saat ini ke CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Ekspor Semua ke CSV ({filteredMembers.length})</span>
          </button>

          <button
            onClick={() =>
              exportMembersToExcel(
                filteredMembers,
                `EKSPOR_KADER_SULUT_${selectedDpd}.xlsx`
              )
            }
            className="btn-white flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer"
            title="Ekspor daftar kader saat ini ke file Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel ({filteredMembers.length})</span>
          </button>

          {canAddMembers(session) && (
            <button
              onClick={onOpenAddModal}
              className="btn-white flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              title="Tambah Kader Baru"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tambah Kader</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Global Search & Cascading Territorial Filter Bar */}
      <MemberFilterBar
        session={session}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchCategory={searchCategory}
        setSearchCategory={setSearchCategory}
        selectedDpd={selectedDpd}
        setSelectedDpd={setSelectedDpd}
        selectedDpcFilter={selectedDpcFilter}
        setSelectedDpcFilter={setSelectedDpcFilter}
        selectedDprtFilter={selectedDprtFilter}
        setSelectedDprtFilter={setSelectedDprtFilter}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        setCurrentPage={setCurrentPage}
        membersCount={members.length}
        filteredCount={filteredMembers.length}
        activeFilteredCount={activeFilteredCount}
        nonActiveFilteredCount={nonActiveFilteredCount}
        dpdOptionsWithCount={dpdOptionsWithCount}
        activeRegion={activeRegion}
        availableDpcOptions={availableDpcOptions}
        availableDprtOptions={availableDprtOptions}
        availableRolesWithCount={availableRolesWithCount}
      />

      {/* Tabs: Pengurus Ber-SK vs Anggota Biasa & Sub-Organ Dewan */}
      <MemberStatsCards
        membershipFilter={membershipFilter}
        setMembershipFilter={setMembershipFilter}
        selectedCouncilFilter={selectedCouncilFilter}
        setSelectedCouncilFilter={setSelectedCouncilFilter}
        setCurrentPage={setCurrentPage}
        territoryScopedTotal={territoryScopedTotal}
        countPengurusScope={countPengurusScope}
        countAnggotaScope={countAnggotaScope}
        countPertimbanganScope={countPertimbanganScope}
        countPakarScope={countPakarScope}
        countPimpinanScope={countPimpinanScope}
      />

      {/* High-density Member Table with Batch Selection, Avatar, Badges & Pagination */}
      <MemberTable
        members={members}
        filteredMembers={filteredMembers}
        paginatedMembers={paginatedMembers}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        session={session}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDpd={selectedDpd}
        onOpenDetailModal={onOpenDetailModal}
        onOpenStatusModal={onOpenStatusModal}
        onOpenEditModal={onOpenEditModal}
        onOpenDeletionRequest={onOpenDeletionRequest}
        onDirectDelete={onDirectDelete}
      />
    </div>
  );
};
