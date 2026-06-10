/**
 * Mind Mesh — Notification Service
 * 
 * Handles in-app notifications and letter generation.
 */

import { databases, ID, APPWRITE_CONFIG } from "@/lib/appwrite";
import type { Notification, LetterData } from "@/lib/types";

const { databaseId } = APPWRITE_CONFIG;
const NOTIFICATIONS_COLLECTION_ID = "notifications";

// ============================================================
// Letter Templates
// ============================================================

function generateWelcomeLetter(data: {
  memberName: string;
  membershipId: string;
  department?: string;
  approvedBy: string;
  approvedAt: string;
}): LetterData {
  const deptLine = data.department ? `\nDepartment: ${data.department}` : "";
  
  return {
    template: "welcome",
    subject: "Welcome to Mind Mesh Club!",
    body: `Dear ${data.memberName},

Congratulations! Your membership application has been approved.

Membership ID: ${data.membershipId}${deptLine}
Date of Approval: ${new Date(data.approvedAt).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})}
Approved by: ${data.approvedBy}

You now have full access to:
- Member-only events and workshops
- Department-specific resources
- Club community and team directory
- Learning roadmaps and materials

Welcome aboard! We're excited to have you as part of the Mind Mesh family.

Best regards,
Mind Mesh Club Administration`,
    metadata: {
      membershipId: data.membershipId,
      department: data.department,
      approvedBy: data.approvedBy,
    },
  };
}

function generatePromotionLetter(data: {
  memberName: string;
  previousRole: string;
  newRole: string;
  newDesignation?: string;
  approvedBy: string;
  approvedAt: string;
  department?: string;
}): LetterData {
  const desigLine = data.newDesignation
    ? `\nDesignation: ${data.newDesignation}`
    : "";
  const deptLine = data.department ? `\nDepartment: ${data.department}` : "";

  return {
    template: "promotion",
    subject: `Promotion to ${data.newDesignation || data.newRole}`,
    body: `Dear ${data.memberName},

We are pleased to inform you that you have been promoted.

Previous Role: ${data.previousRole}
New Role: ${data.newRole}${desigLine}${deptLine}
Effective Date: ${new Date(data.approvedAt).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})}
Approved by: ${data.approvedBy}

${
  data.newDesignation
    ? `As a ${data.newDesignation}, you will have additional responsibilities and access to department-specific tools and resources.`
    : "You now have additional responsibilities and access to new features."
}

Congratulations on this achievement!

Best regards,
Mind Mesh Club Administration`,
    metadata: {
      previousRole: data.previousRole,
      newRole: data.newRole,
      designation: data.newDesignation,
      approvedBy: data.approvedBy,
    },
  };
}

function generateDesignationLetter(data: {
  memberName: string;
  designationName: string;
  designationDescription?: string;
  department?: string;
  assignedBy: string;
  assignedAt: string;
}): LetterData {
  const deptLine = data.department ? `\nDepartment: ${data.department}` : "";
  const descLine = data.designationDescription
    ? `\nDescription: ${data.designationDescription}`
    : "";

  return {
    template: "designation",
    subject: `Designation Assigned: ${data.designationName}`,
    body: `Dear ${data.memberName},

You have been assigned a new designation within Mind Mesh Club.

Designation: ${data.designationName}${descLine}${deptLine}
Assigned on: ${new Date(data.assignedAt).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})}
Assigned by: ${data.assignedBy}

This designation is now visible on your profile as a badge.

Best regards,
Mind Mesh Club Administration`,
    metadata: {
      designationName: data.designationName,
      department: data.department,
      assignedBy: data.assignedBy,
    },
  };
}

// ============================================================
// Notification CRUD
// ============================================================

/**
 * Create a notification.
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  letter?: LetterData;
  data?: Record<string, any>;
}): Promise<Notification | null> {
  try {
    const notification = await databases.createDocument(
      databaseId,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        letter: params.letter || null,
        data: params.data || null,
        read: false,
        createdAt: new Date().toISOString(),
      }
    );

    return notification as unknown as Notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Send welcome notification with letter.
 */
export async function sendWelcomeNotification(params: {
  userId: string;
  memberName: string;
  membershipId: string;
  department?: string;
  approvedBy: string;
  approvedAt: string;
}): Promise<void> {
  const letter = generateWelcomeLetter({
    memberName: params.memberName,
    membershipId: params.membershipId,
    department: params.department,
    approvedBy: params.approvedBy,
    approvedAt: params.approvedAt,
  });

  await createNotification({
    userId: params.userId,
    type: "membership.approved",
    title: "Welcome to Mind Mesh Club!",
    body: `Your membership application has been approved. Membership ID: ${params.membershipId}`,
    letter,
    data: {
      membershipId: params.membershipId,
      department: params.department,
    },
  });
}

/**
 * Send promotion notification with letter.
 */
export async function sendPromotionNotification(params: {
  userId: string;
  memberName: string;
  previousRole: string;
  newRole: string;
  newDesignation?: string;
  approvedBy: string;
  approvedAt: string;
  department?: string;
}): Promise<void> {
  const letter = generatePromotionLetter({
    memberName: params.memberName,
    previousRole: params.previousRole,
    newRole: params.newRole,
    newDesignation: params.newDesignation,
    approvedBy: params.approvedBy,
    approvedAt: params.approvedAt,
    department: params.department,
  });

  await createNotification({
    userId: params.userId,
    type: "role.promoted",
    title: `Promoted to ${params.newDesignation || params.newRole}`,
    body: `You have been promoted from ${params.previousRole} to ${params.newRole}.`,
    letter,
    data: {
      previousRole: params.previousRole,
      newRole: params.newRole,
      designation: params.newDesignation,
    },
  });
}

/**
 * Send designation notification with letter.
 */
export async function sendDesignationNotification(params: {
  userId: string;
  memberName: string;
  designationName: string;
  designationDescription?: string;
  department?: string;
  assignedBy: string;
  assignedAt: string;
}): Promise<void> {
  const letter = generateDesignationLetter({
    memberName: params.memberName,
    designationName: params.designationName,
    designationDescription: params.designationDescription,
    department: params.department,
    assignedBy: params.assignedBy,
    assignedAt: params.assignedAt,
  });

  await createNotification({
    userId: params.userId,
    type: "designation.assigned",
    title: `Designation: ${params.designationName}`,
    body: `You have been assigned the designation "${params.designationName}".`,
    letter,
    data: {
      designationName: params.designationName,
      department: params.department,
    },
  });
}

/**
 * Send rejection notification.
 */
export async function sendRejectionNotification(params: {
  userId: string;
  type: "membership.rejected" | "event.rejected" | "registration.rejected";
  title: string;
  reason: string;
  data?: Record<string, any>;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: `Reason: ${params.reason}`,
    data: params.data,
  });
}

/**
 * Get notifications for a user.
 */
export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const queries: string[] = [
    `equal("userId", "${userId}")`,
    `orderDesc("createdAt")`,
    `limit(${options?.limit || 50})`,
  ];

  if (options?.unreadOnly) {
    queries.push(`equal("read", false)`);
  }

  if (options?.offset) {
    queries.push(`offset(${options.offset})`);
  }

  try {
    const response = await databases.listDocuments(
      databaseId,
      NOTIFICATIONS_COLLECTION_ID,
      queries
    );

    // Get unread count separately
    const unreadResponse = await databases.listDocuments(
      databaseId,
      NOTIFICATIONS_COLLECTION_ID,
      [
        `equal("userId", "${userId}")`,
        `equal("read", false)`,
        `limit(1)`,
      ]
    );

    return {
      notifications: response.documents as unknown as Notification[],
      total: response.total,
      unreadCount: unreadResponse.total,
    };
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return { notifications: [], total: 0, unreadCount: 0 };
  }
}

/**
 * Mark notification as read.
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  try {
    await databases.updateDocument(
      databaseId,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId,
      {
        read: true,
        readAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(
  userId: string
): Promise<void> {
  try {
    const { notifications } = await getUserNotifications(userId, {
      unreadOnly: true,
      limit: 100,
    });

    await Promise.all(
      notifications.map((n) =>
        n.$id ? markNotificationRead(n.$id) : Promise.resolve()
      )
    );
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}
