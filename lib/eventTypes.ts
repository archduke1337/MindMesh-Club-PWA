import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { EventType } from "./types";

export const eventTypeService = {
  async getAll(): Promise<EventType[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        [Query.orderAsc("displayOrder")]
      );
      return response.documents as unknown as EventType[];
    } catch (error) {
      console.error("Error fetching event types:", error);
      throw error;
    }
  },

  async getActive(): Promise<EventType[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        [Query.equal("isActive", true), Query.orderAsc("displayOrder")]
      );
      return response.documents as unknown as EventType[];
    } catch (error) {
      console.error("Error fetching active event types:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<EventType | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        id
      );
      return response as unknown as EventType;
    } catch (error) {
      console.error("Error fetching event type:", error);
      return null;
    }
  },

  async getByName(name: string): Promise<EventType | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        [Query.equal("name", [name]), Query.limit(1)]
      );
      return (response.documents[0] as unknown as EventType) || null;
    } catch (error) {
      console.error("Error fetching event type by name:", error);
      return null;
    }
  },

  async create(data: Omit<EventType, "$id" | "$createdAt" | "$updatedAt">): Promise<EventType> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        ID.unique(),
        data
      );
      return response as unknown as EventType;
    } catch (error) {
      console.error("Error creating event type:", error);
      throw error;
    }
  },

  async update(id: string, data: Partial<EventType>): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        id,
        data
      );
    } catch (error) {
      console.error("Error updating event type:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPES,
        id
      );
    } catch (error) {
      console.error("Error deleting event type:", error);
      throw error;
    }
  },

  async seedDefaults(): Promise<void> {
    const existing = await this.getAll();
    const existingNames = new Set(existing.map((t) => t.name));

    const defaults: Omit<EventType, "$id" | "$createdAt" | "$updatedAt">[] = [
      {
        name: "workshop",
        displayName: "Workshop",
        description: "Hands-on learning sessions with tools, prerequisites, and practical exercises.",
        icon: "Wrench",
        fields: [
          { name: "prerequisites", type: "multi-select", label: "Prerequisites", required: false, options: [] },
          { name: "toolsNeeded", type: "multi-select", label: "Tools Needed", required: false, options: [] },
          { name: "difficultyLevel", type: "select", label: "Difficulty Level", required: true, options: ["beginner", "intermediate", "advanced"] },
          { name: "durationHours", type: "number", label: "Duration (Hours)", required: true },
          { name: "handsOn", type: "boolean", label: "Hands-On Exercises", required: true },
          { name: "certificatesProvided", type: "boolean", label: "Certificates Provided", required: true },
        ],
        registrationConfig: {
          defaultAudience: "member_only",
          allowGuestRegistration: false,
          requiresApproval: false,
          maxTeamSize: 1,
          waitlistEnabled: true,
          cancellationAllowed: true,
          cancellationDeadline: "24h_before_event",
        },
        ticketConfig: {
          ticketType: "standard",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: false,
          verificationMethods: ["qr_scan", "manual_search"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: true,
        },
        isActive: true,
        displayOrder: 1,
      },
      {
        name: "hackathon",
        displayName: "Hackathon",
        description: "Multi-hour coding competitions with teams, tracks, judging, and submissions.",
        icon: "Code",
        fields: [
          { name: "teamSizeMin", type: "number", label: "Min Team Size", required: true },
          { name: "teamSizeMax", type: "number", label: "Max Team Size", required: true },
          { name: "tracks", type: "multi-select", label: "Tracks", required: true, options: [] },
          { name: "judgingCriteria", type: "json", label: "Judging Criteria", required: true },
          { name: "submissionRules", type: "text", label: "Submission Rules", required: true },
          { name: "durationHours", type: "number", label: "Duration (Hours)", required: true },
        ],
        registrationConfig: {
          defaultAudience: "member_only",
          allowGuestRegistration: false,
          requiresApproval: false,
          maxTeamSize: "dynamic",
          teamFormationEnabled: true,
          waitlistEnabled: true,
          cancellationAllowed: true,
          cancellationDeadline: "48h_before_event",
        },
        ticketConfig: {
          ticketType: "team",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: false,
          verificationMethods: ["qr_scan", "manual_search"],
          teamTicket: true,
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: false,
        },
        isActive: true,
        displayOrder: 2,
      },
      {
        name: "seminar",
        displayName: "Seminar",
        description: "Educational sessions with speakers, topic-focused presentations, and knowledge sharing.",
        icon: "GraduationCap",
        fields: [
          { name: "speakers", type: "json", label: "Speakers", required: true },
          { name: "topicArea", type: "text", label: "Topic Area", required: true },
          { name: "certificateEligible", type: "boolean", label: "Certificate Eligible", required: true },
          { name: "recordingAllowed", type: "boolean", label: "Recording Allowed", required: true },
          { name: "qnaAllowed", type: "boolean", label: "Q&A Session", required: true },
        ],
        registrationConfig: {
          defaultAudience: "public",
          allowGuestRegistration: true,
          requiresApproval: false,
          maxTeamSize: 1,
          waitlistEnabled: true,
          cancellationAllowed: true,
          cancellationDeadline: "12h_before_event",
        },
        ticketConfig: {
          ticketType: "standard",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: true,
          verificationMethods: ["qr_scan", "manual_search"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: true,
        },
        isActive: true,
        displayOrder: 3,
      },
      {
        name: "competition",
        displayName: "Competition",
        description: "Competitive events with scoring, rounds, submissions, and prizes.",
        icon: "Trophy",
        fields: [
          { name: "scoringRubric", type: "json", label: "Scoring Rubric", required: true },
          { name: "submissionFormat", type: "text", label: "Submission Format", required: true },
          { name: "rounds", type: "json", label: "Rounds", required: true },
          { name: "teamCompetition", type: "boolean", label: "Team Competition", required: true },
        ],
        registrationConfig: {
          defaultAudience: "member_only",
          allowGuestRegistration: false,
          requiresApproval: false,
          maxTeamSize: "dynamic",
          waitlistEnabled: false,
          cancellationAllowed: true,
          cancellationDeadline: "before_first_round",
        },
        ticketConfig: {
          ticketType: "standard",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: false,
          verificationMethods: ["qr_scan", "manual_search"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: false,
        },
        isActive: true,
        displayOrder: 4,
      },
      {
        name: "bootcamp",
        displayName: "Bootcamp",
        description: "Multi-day intensive training programs with curriculum, homework, and certification.",
        icon: "Flame",
        fields: [
          { name: "durationWeeks", type: "number", label: "Duration (Weeks)", required: true },
          { name: "curriculum", type: "json", label: "Curriculum", required: true },
          { name: "homeworkRequired", type: "boolean", label: "Homework Required", required: true },
          { name: "certificationProvided", type: "boolean", label: "Certification Provided", required: true },
          { name: "difficultyLevel", type: "select", label: "Difficulty Level", required: true, options: ["beginner", "intermediate", "advanced"] },
        ],
        registrationConfig: {
          defaultAudience: "member_only",
          allowGuestRegistration: false,
          requiresApproval: true,
          maxTeamSize: 1,
          waitlistEnabled: true,
          cancellationAllowed: true,
          cancellationDeadline: "48h_before_start",
        },
        ticketConfig: {
          ticketType: "standard",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: false,
          verificationMethods: ["qr_scan", "manual_search"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: false,
        },
        isActive: true,
        displayOrder: 5,
      },
      {
        name: "meetup",
        displayName: "Meetup",
        description: "Casual networking and discussion events.",
        icon: "Users",
        fields: [
          { name: "agenda", type: "json", label: "Agenda", required: false },
          { name: "refreshments", type: "boolean", label: "Refreshments Provided", required: true },
          { name: "networkingFocused", type: "boolean", label: "Networking Focused", required: true },
        ],
        registrationConfig: {
          defaultAudience: "public",
          allowGuestRegistration: true,
          requiresApproval: false,
          maxTeamSize: 1,
          waitlistEnabled: false,
          cancellationAllowed: true,
          cancellationDeadline: "6h_before_event",
        },
        ticketConfig: {
          ticketType: "standard",
          maxEntries: 1,
          qrEnabled: false,
          transferAllowed: false,
          verificationMethods: ["manual_search"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager", "member"],
          approvalRequired: false,
          approverRoles: ["head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: true,
        },
        isActive: true,
        displayOrder: 6,
      },
      {
        name: "guest_lecture",
        displayName: "Guest Lecture",
        description: "External expert presentations and industry talks.",
        icon: "Mic",
        fields: [
          { name: "speakerBio", type: "text", label: "Speaker Bio", required: true },
          { name: "speakerCompany", type: "text", label: "Speaker Company", required: true },
          { name: "topicArea", type: "text", label: "Topic Area", required: true },
          { name: "recordingAllowed", type: "boolean", label: "Recording Allowed", required: true },
          { name: "certificateEligible", type: "boolean", label: "Certificate Eligible", required: true },
        ],
        registrationConfig: {
          defaultAudience: "public",
          allowGuestRegistration: true,
          requiresApproval: false,
          maxTeamSize: 1,
          waitlistEnabled: true,
          cancellationAllowed: true,
          cancellationDeadline: "12h_before_event",
        },
        ticketConfig: {
          ticketType: "standard",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: true,
          verificationMethods: ["qr_scan", "manual_search"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: true,
        },
        isActive: true,
        displayOrder: 7,
      },
      {
        name: "certification_exam",
        displayName: "Certification Exam",
        description: "Formal certification examinations with scoring and validity tracking.",
        icon: "Award",
        fields: [
          { name: "examBody", type: "text", label: "Exam Body", required: true },
          { name: "validityPeriod", type: "text", label: "Validity Period", required: true },
          { name: "retakePolicy", type: "text", label: "Retake Policy", required: true },
          { name: "passingScore", type: "number", label: "Passing Score", required: true },
          { name: "examDuration", type: "number", label: "Exam Duration (min)", required: true },
        ],
        registrationConfig: {
          defaultAudience: "member_only",
          allowGuestRegistration: false,
          requiresApproval: true,
          maxTeamSize: 1,
          waitlistEnabled: false,
          cancellationAllowed: true,
          cancellationDeadline: "48h_before_exam",
        },
        ticketConfig: {
          ticketType: "exam_seat",
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: false,
          verificationMethods: ["qr_scan", "manual_search", "id_verification"],
        },
        workflowConfig: {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: false,
        },
        isActive: true,
        displayOrder: 8,
      },
    ];

    for (const typeDef of defaults) {
      if (!existingNames.has(typeDef.name)) {
        await this.create(typeDef);
      }
    }
  },
};
