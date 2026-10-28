/**
 * Titik impor tunggal untuk akses data ke backend API.
 * (Nama fungsi dipertahankan agar komponen yang sudah ada tetap kompatibel.)
 */
import { isBackendConfigured } from '../config/api';
import { MemberService } from '../services/memberService';
import { AuditService } from '../services/auditService';
import { DeletionRequestService } from '../services/deletionService';

export { API_BASE_URL, isBackendConfigured } from '../config/api';
export {
  MemberService,
  AuditService,
  DeletionRequestService,
  UserService,
  subscribeToAllRealtime,
  mapDbRowToMember,
  mapMemberToDbPayload,
  mapApiMember,
  mapApiAuditLog,
  mapApiDeletionRequest,
  mapApiUser,
  getToken,
  clearToken,
  AUTH_EXPIRED_EVENT,
} from '../services';

// API Function bindings
export const getMembersFromApi = MemberService.getAll;
export const createMemberInApi = MemberService.createOne;
export const updateMemberInApi = MemberService.updateOne;
export const upsertSingleMemberToApi = MemberService.upsertOne;
export const changeMemberStatusInApi = MemberService.changeStatus;
export const upsertMembersToApi = MemberService.upsertBatch;
export const deleteMemberFromApi = MemberService.deleteOne;
export const deleteMembersFromApi = MemberService.deleteBatch;

export const getAuditLogsFromApi = AuditService.getAll;
export const insertAuditLogToApi = AuditService.insert;

export const getDeletionRequestsFromApi = DeletionRequestService.getAll;
export const insertDeletionRequestToApi = DeletionRequestService.insert;
export const updateDeletionRequestInApi = DeletionRequestService.update;

// Legacy alias compatibility (memastikan semua pemanggilan lama otomatis memakai backend API)
export const isSupabaseConfigured = isBackendConfigured;
export const getMembersFromSupabase = MemberService.getAll;
export const createSingleMemberToSupabase = MemberService.createOne;
export const updateSingleMemberToSupabase = MemberService.updateOne;
export const upsertSingleMemberToSupabase = MemberService.upsertOne;
export const upsertMembersToSupabase = MemberService.upsertBatch;
export const deleteMemberFromSupabase = MemberService.deleteOne;
export const deleteMembersFromSupabase = MemberService.deleteBatch;
export const getAuditLogsFromSupabase = AuditService.getAll;
export const insertAuditLogToSupabase = AuditService.insert;
export const getDeletionRequestsFromSupabase = DeletionRequestService.getAll;
export const insertDeletionRequestToSupabase = DeletionRequestService.insert;
export const updateDeletionRequestInSupabase = DeletionRequestService.update;
