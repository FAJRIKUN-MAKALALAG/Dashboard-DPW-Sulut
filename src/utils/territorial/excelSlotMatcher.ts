import { Member } from '../../types';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../structureReadinessUtils';
import { cleanPersonName, isJobTitleMatch } from '../jobMatchingUtils';

export function findSameTerritorySlotMember(
  expandedMembers: Member[],
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  dpd: string,
  dpc: string,
  dprt: string,
  subOrg: string,
  jabatan: string,
  personName?: string
): Member | undefined {
  const targetName = cleanPersonName(personName).toLowerCase();
  return expandedMembers.find((m) => {
    if (m.tingkatKepengurusan !== level) return false;
    if (level !== 'DPW' && !isDpdMatch(m.dpd, dpd)) return false;
    if ((level === 'DPC' || level === 'DPRt') && !isDpcMatch(m.dpc, dpc)) return false;
    if (level === 'DPRt' && !isDprtMatch(m.dprt, dprt)) return false;
    if ((m.wilayahPenugasan || '').trim().toLowerCase() !== subOrg.trim().toLowerCase()) {
      return false;
    }
    if (!isJobTitleMatch(m.jabatan, jabatan, subOrg)) return false;
    // Hanya gunakan ulang NIK lama jika memang orang yang sama (cegah menimpa NIK KTP pengurus lama yang berbeda)
    if (targetName) {
      const memberName = cleanPersonName(m.namaLengkap).toLowerCase();
      if (memberName && memberName !== targetName) return false;
    }
    return true;
  });
}

export function stripMemberPositions(member?: Member): Partial<Member> {
  if (!member) return {};
  const { positions: _stalePositions, id: _staleId, ...rest } = member;
  return rest;
}

