/**
 * Re-export services & config for backward compatibility
 */
export { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../config/database';
export {
  MemberService,
  AuditService,
  DeletionRequestService,
  UserService,
  subscribeToAllRealtime,
  mapDbRowToMember,
  mapMemberToDbPayload,
  mapDbRowToAuditLog,
  mapDbRowToDeletionRequest,
  mapDbRowToAppUser,
  mapAppUserToDbPayload,
} from '../services';

// Re-export convenience functions to maintain zero breaking changes across existing components
import { MemberService } from '../services/memberService';
import { AuditService } from '../services/auditService';
import { DeletionRequestService } from '../services/deletionService';
import { UserService } from '../services/userService';

export const getMembersFromSupabase = MemberService.getAll;
export const upsertSingleMemberToSupabase = MemberService.upsertOne;
export const upsertMembersToSupabase = MemberService.upsertBatch;
export const deleteMemberFromSupabase = MemberService.deleteOne;
export const deleteMembersFromSupabase = MemberService.deleteBatch;

export const getAuditLogsFromSupabase = AuditService.getAll;
export const insertAuditLogToSupabase = AuditService.insert;

export const getDeletionRequestsFromSupabase = DeletionRequestService.getAll;
export const insertDeletionRequestToSupabase = DeletionRequestService.insert;
export const updateDeletionRequestInSupabase = DeletionRequestService.update;
