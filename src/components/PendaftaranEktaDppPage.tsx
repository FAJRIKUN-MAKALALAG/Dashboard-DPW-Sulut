import React from 'react';
import { Member } from '../types';
import { DppEktaRegistrationPanel } from '../dpp-ekta';

interface PendaftaranEktaDppPageProps {
  members: Member[];
  initialMember?: Member | null;
  onMemberEktaUpdated?: (nik: string, nokta: string, updatedMember?: Member) => void;
  onBackToDashboard?: () => void;
  onNavigateToPendaftaran?: () => void;
  onNavigateToMembers?: () => void;
}

export const PendaftaranEktaDppPage: React.FC<PendaftaranEktaDppPageProps> = ({
  members,
  initialMember,
  onMemberEktaUpdated,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-page-enter pb-16 font-sans">
      {/* Container Panel Utama: Lebar Penuh Responsif di Mobile & Desktop */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-5 md:p-8">
          <DppEktaRegistrationPanel
            members={members}
            initialMember={initialMember}
            onMemberEktaUpdated={onMemberEktaUpdated}
          />
        </div>
      </div>
    </div>
  );
};
