import React from 'react';
import { Member, UserSession } from '../types';
import { DppEktaRegistrationPanel } from '../dpp-ekta';

interface PendaftaranEktaDppPageProps {
  members: Member[];
  session?: UserSession;
  initialMember?: Member | null;
  onMemberEktaUpdated?: (nik: string, nokta: string, updatedMember?: Member) => void;
  onBackToDashboard?: () => void;
  onNavigateToPendaftaran?: () => void;
  onNavigateToMembers?: () => void;
}

export const PendaftaranEktaDppPage: React.FC<PendaftaranEktaDppPageProps> = ({
  members,
  session,
  initialMember,
  onMemberEktaUpdated,
}) => {
  return (
    <div className="w-full animate-page-enter pb-10 font-sans">
      {/* Container Panel Utama: Memanfaatkan Lebar Penuh Desktop & Responsif Mobile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-5 lg:p-6">
          <DppEktaRegistrationPanel
            members={members}
            session={session}
            initialMember={initialMember}
            onMemberEktaUpdated={onMemberEktaUpdated}
          />
        </div>
      </div>
    </div>
  );
};
