import prisma from './prisma';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'CHANGE_PASSWORD'
  | 'CHANGE_USERNAME'
  | 'UPLOAD_IMAGE'
  | 'EDIT_IMAGE'
  | 'DELETE_IMAGE'
  | 'CREATE_CATEGORY'
  | 'EDIT_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'UPDATE_SETTINGS'
  | 'CREATE_CONTENT_BLOCK'
  | 'EDIT_CONTENT_BLOCK'
  | 'DELETE_CONTENT_BLOCK'
  | 'CREATE_BACKUP'
  | 'RESTORE_BACKUP';

/**
 * Record an action in the audit log (sanitized, no secrets or tokens)
 */
export async function logAudit({
  adminId,
  action,
  details,
  ipAddress,
}: {
  adminId?: string;
  action: AuditAction;
  details?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Lỗi khi ghi audit log:', err);
  }
}
