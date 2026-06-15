// lib/seed.ts
// Seed default event types into the event_types collection

import { ID, Query } from "appwrite";
import { createAdminClient } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { EventType } from "./types";

const DEFAULT_EVENT_TYPES: Omit<EventType, "$id" | "$createdAt" | "$updatedAt">[] = [
  {
    name: "workshop",
    displayName: "Workshop",
    description: "Hands-on learning session with guided exercises",
    icon: "🔧",
    fields: [
      { name: "skillLevel", type: "select", label: "Skill Level", required: true, options: ["beginner", "intermediate", "advanced"] },
      { name: "prerequisites", type: "textarea", label: "Prerequisites", required: false },
      { name: "materialsNeeded", type: "textarea", label: "Materials Needed", required: false },
    ],
    registrationConfig: {
      defaultAudience: "public",
      allowGuestRegistration: true,
      requiresApproval: false,
      maxTeamSize: 1,
      waitlistEnabled: true,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "standard",
      maxEntries: 1,
      qrEnabled: true,
      transferAllowed: false,
      verificationMethods: ["qr_scan", "manual_search"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "head", "admin"],
      approvalRequired: false,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 1,
  },
  {
    name: "hackathon",
    displayName: "Hackathon",
    description: "Intensive coding competition to build projects in a time limit",
    icon: "💻",
    fields: [
      { name: "teamSize", type: "number", label: "Team Size", required: true },
      { name: "theme", type: "text", label: "Theme", required: false },
      { name: "judgingCriteria", type: "textarea", label: "Judging Criteria", required: false },
      { name: "prizes", type: "textarea", label: "Prizes", required: false },
    ],
    registrationConfig: {
      defaultAudience: "public",
      allowGuestRegistration: true,
      requiresApproval: false,
      maxTeamSize: "dynamic",
      teamFormationEnabled: true,
      waitlistEnabled: true,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "team",
      maxEntries: 1,
      qrEnabled: true,
      transferAllowed: false,
      verificationMethods: ["qr_scan", "manual_search"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "head", "admin"],
      approvalRequired: true,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 2,
  },
  {
    name: "seminar",
    displayName: "Seminar",
    description: "Expert talk or panel discussion on a specific topic",
    icon: "🎓",
    fields: [
      { name: "speakerBio", type: "textarea", label: "Speaker Bio", required: false },
      { name: "topics", type: "array", label: "Topics Covered", required: false },
    ],
    registrationConfig: {
      defaultAudience: "public",
      allowGuestRegistration: true,
      requiresApproval: false,
      maxTeamSize: 1,
      waitlistEnabled: false,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "standard",
      maxEntries: 1,
      qrEnabled: true,
      transferAllowed: true,
      verificationMethods: ["qr_scan"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "pr.outreach", "head", "admin"],
      approvalRequired: false,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 3,
  },
  {
    name: "meeting",
    displayName: "Meeting",
    description: "Regular team or department meetings",
    icon: "📅",
    fields: [
      { name: "agenda", type: "textarea", label: "Agenda", required: false },
      { name: "meetingLink", type: "url", label: "Meeting Link", required: false },
    ],
    registrationConfig: {
      defaultAudience: "member_only",
      allowGuestRegistration: false,
      requiresApproval: false,
      maxTeamSize: 1,
      waitlistEnabled: false,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "standard",
      maxEntries: 1,
      qrEnabled: false,
      transferAllowed: false,
      verificationMethods: ["manual_search"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "head", "admin"],
      approvalRequired: false,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 4,
  },
  {
    name: "social",
    displayName: "Social Event",
    description: "Fun networking and team-building activities",
    icon: "🎉",
    fields: [
      { name: "dressCode", type: "text", label: "Dress Code", required: false },
      { name: "activities", type: "textarea", label: "Planned Activities", required: false },
    ],
    registrationConfig: {
      defaultAudience: "public",
      allowGuestRegistration: true,
      requiresApproval: false,
      maxTeamSize: 1,
      waitlistEnabled: false,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "standard",
      maxEntries: 1,
      qrEnabled: true,
      transferAllowed: true,
      verificationMethods: ["qr_scan"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "social.media", "head", "admin"],
      approvalRequired: false,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 5,
  },
  {
    name: "competition",
    displayName: "Competition",
    description: "Technical or non-technical competition with scoring",
    icon: "🏆",
    fields: [
      { name: "rules", type: "textarea", label: "Rules", required: false },
      { name: "rounds", type: "number", label: "Number of Rounds", required: false },
      { name: "prizes", type: "textarea", label: "Prizes", required: false },
    ],
    registrationConfig: {
      defaultAudience: "public",
      allowGuestRegistration: true,
      requiresApproval: false,
      maxTeamSize: "dynamic",
      teamFormationEnabled: true,
      waitlistEnabled: true,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "team",
      maxEntries: 1,
      qrEnabled: true,
      transferAllowed: false,
      verificationMethods: ["qr_scan", "manual_search"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "head", "admin"],
      approvalRequired: true,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 6,
  },
  {
    name: "certification",
    displayName: "Certification Program",
    description: "Multi-session certification course with assessment",
    icon: "📜",
    fields: [
      { name: "duration", type: "text", label: "Duration", required: true },
      { name: "sessions", type: "number", label: "Number of Sessions", required: true },
      { name: "certificationBody", type: "text", label: "Certification Body", required: false },
    ],
    registrationConfig: {
      defaultAudience: "member_only",
      allowGuestRegistration: false,
      requiresApproval: true,
      maxTeamSize: 1,
      waitlistEnabled: true,
      cancellationAllowed: false,
    },
    ticketConfig: {
      ticketType: "standard",
      maxEntries: 1,
      qrEnabled: true,
      transferAllowed: false,
      verificationMethods: ["qr_scan", "manual_search"],
    },
    workflowConfig: {
      draftPermission: ["head", "admin"],
      approvalRequired: true,
      approverRoles: ["head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: false,
    },
    isActive: true,
    displayOrder: 7,
  },
  {
    name: "other",
    displayName: "Other",
    description: "Any event type not covered above",
    icon: "📌",
    fields: [],
    registrationConfig: {
      defaultAudience: "public",
      allowGuestRegistration: true,
      requiresApproval: false,
      maxTeamSize: 1,
      waitlistEnabled: false,
      cancellationAllowed: true,
    },
    ticketConfig: {
      ticketType: "standard",
      maxEntries: 1,
      qrEnabled: false,
      transferAllowed: false,
      verificationMethods: ["manual_search"],
    },
    workflowConfig: {
      draftPermission: ["events.logistics", "head", "admin"],
      approvalRequired: false,
      approverRoles: ["lead", "head", "admin"],
      publishAfterApproval: true,
      autoActivateAtEventTime: true,
    },
    isActive: true,
    displayOrder: 8,
  },
];

export async function seedEventTypes(): Promise<{ created: number; skipped: number }> {
  const { databases } = createAdminClient();

  // Check existing
  const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENT_TYPES, [
    Query.limit(100),
  ]);

  const existingNames = new Set(
    existing.documents.map((doc: { name: string }) => doc.name)
  );

  let created = 0;
  let skipped = 0;

  for (const eventType of DEFAULT_EVENT_TYPES) {
    if (existingNames.has(eventType.name)) {
      skipped++;
      continue;
    }
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENT_TYPES,
      ID.unique(),
      eventType
    );
    created++;
  }

  return { created, skipped };
}
