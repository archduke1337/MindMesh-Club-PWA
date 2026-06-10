/**
 * Mind Mesh — Audit Logging Service
 * 
 * Comprehensive system-wide audit trail. Every action is logged.
 */

import { databases, ID, APPWRITE_CONFIG } from "@/lib/appwrite";
import type { AuditLog } from "@/lib/types";

const { databaseId } = APPWRITE_CONFIG;
const AUDIT_COLLECTION_ID = "audit_logs";

/**
 * Log an audit event.
 */
export async function logAudit(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const auditEntry: Omit<AuditLog, "$id" | "$createdAt"> = {
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      timestamp: new Date().toISOString(),
    };

    await databases.createDocument(
      databaseId,
      AUDIT_COLLECTION_ID,
      ID.unique(),
      auditEntry
    );
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error("Audit log failed:", error);
  }
}

/**
 * Log a profile change with before/after diff.
 */
export async function logProfileChange(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  targetUserId: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: "profile.update",
    entityType: "user",
    entityId: params.targetUserId,
    details: {
      field: params.field,
      oldValue: params.oldValue,
      newValue: params.newValue,
      reason: params.reason,
    },
  });
}

/**
 * Log a membership action.
 */
export async function logMembershipAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "membership.approve" | "membership.reject" | "membership.ban" | "membership.deactivate";
  targetUserId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "user",
    entityId: params.targetUserId,
    details: params.details,
  });
}

/**
 * Log a designation action.
 */
export async function logDesignationAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "designation.assign" | "designation.revoke";
  targetUserId: string;
  designationId: string;
  designationName: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "designation",
    entityId: params.designationId,
    details: {
      targetUserId: params.targetUserId,
      designationName: params.designationName,
      ...params.details,
    },
  });
}

/**
 * Log a power action.
 */
export async function logPowerAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "power.grant" | "power.revoke";
  targetUserId: string;
  powerId: string;
  powerName: string;
  departmentId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "power",
    entityId: params.powerId,
    details: {
      targetUserId: params.targetUserId,
      powerName: params.powerName,
      departmentId: params.departmentId,
      ...params.details,
    },
  });
}

/**
 * Log an event action.
 */
export async function logEventAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "event.create" | "event.update" | "event.approve" | "event.reject" | "event.publish" | "event.cancel";
  eventId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "event",
    entityId: params.eventId,
    details: params.details,
  });
}

/**
 * Log a ticket action.
 */
export async function logTicketAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "ticket.issue" | "ticket.verify" | "ticket.invalidate" | "ticket.transfer";
  ticketId: string;
  eventId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "ticket",
    entityId: params.ticketId,
    details: {
      eventId: params.eventId,
      ...params.details,
    },
  });
}

/**
 * Log a registration action.
 */
export async function logRegistrationAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "registration.register" | "registration.approve" | "registration.reject" | "registration.cancel";
  registrationId: string;
  eventId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "registration",
    entityId: params.registrationId,
    details: {
      eventId: params.eventId,
      ...params.details,
    },
  });
}

/**
 * Log a resource action.
 */
export async function logResourceAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "resource.upload" | "resource.update" | "resource.delete";
  resourceId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "resource",
    entityId: params.resourceId,
    details: params.details,
  });
}

/**
 * Log a blog action.
 */
export async function logBlogAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "blog.create" | "blog.approve" | "blog.reject" | "blog.publish" | "blog.delete";
  blogId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "blog",
    entityId: params.blogId,
    details: params.details,
  });
}

/**
 * Log a gallery action.
 */
export async function logGalleryAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "gallery.upload" | "gallery.approve" | "gallery.reject" | "gallery.delete";
  imageId: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "gallery",
    entityId: params.imageId,
    details: params.details,
  });
}

/**
 * Log a department action.
 */
export async function logDepartmentAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "department.assign" | "department.remove";
  targetUserId: string;
  departmentId: string;
  departmentName: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: "department",
    entityId: params.departmentId,
    details: {
      targetUserId: params.targetUserId,
      departmentName: params.departmentName,
      ...params.details,
    },
  });
}

/**
 * Query audit logs with filters.
 */
export async function queryAuditLogs(params: {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const queries: string[] = [];

  if (params.actorId) {
    queries.push(`equal("actorId", "${params.actorId}")`);
  }
  if (params.entityType) {
    queries.push(`equal("entityType", "${params.entityType}")`);
  }
  if (params.entityId) {
    queries.push(`equal("entityId", "${params.entityId}")`);
  }
  if (params.action) {
    queries.push(`equal("action", "${params.action}")`);
  }
  if (params.startDate) {
    queries.push(`greaterThanEqual("timestamp", "${params.startDate}")`);
  }
  if (params.endDate) {
    queries.push(`lessThanEqual("timestamp", "${params.endDate}")`);
  }

  queries.push(`orderDesc("timestamp")`);
  queries.push(`limit(${params.limit || 50})`);
  if (params.offset) {
    queries.push(`offset(${params.offset})`);
  }

  try {
    const response = await databases.listDocuments(
      databaseId,
      AUDIT_COLLECTION_ID,
      queries
    );

    return {
      logs: response.documents as unknown as AuditLog[],
      total: response.total,
    };
  } catch (error) {
    console.error("Failed to query audit logs:", error);
    return { logs: [], total: 0 };
  }
}
