// lib/database.ts
import { ID, Query } from "appwrite";
import { databases, APPWRITE_CONFIG } from "./appwrite";

const { databaseId: DATABASE_ID, eventsCollectionId: EVENTS_COLLECTION_ID, registrationsCollectionId: REGISTRATIONS_COLLECTION_ID, projectsCollectionId: PROJECTS_COLLECTION_ID, eventImagesBucketId: EVENT_IMAGES_BUCKET_ID } = APPWRITE_CONFIG;

export { DATABASE_ID, EVENTS_COLLECTION_ID, REGISTRATIONS_COLLECTION_ID, PROJECTS_COLLECTION_ID, EVENT_IMAGES_BUCKET_ID };

export const COLLECTIONS = {
  EVENTS: EVENTS_COLLECTION_ID,
  REGISTRATIONS: REGISTRATIONS_COLLECTION_ID,
  PROJECTS: PROJECTS_COLLECTION_ID,
  PROFILES: "profiles",
  APPLICATIONS: "applications",
  MEMBERSHIPS: "memberships",
  DEPARTMENTS: "departments",
  USER_DEPARTMENTS: "user_departments",
  DESIGNATIONS: "designations",
  USER_DESIGNATIONS: "user_designations",
  POWERS: "powers",
  USER_POWERS: "user_powers",
  TICKETS: "tickets",
  TICKET_VERIFICATIONS: "ticket_verifications",
  RESOURCES: "resources",
  NOTIFICATIONS: "notifications",
  AUDIT_LOGS: "audit_logs",
  APPROVAL_WORKFLOWS: "approval_workflows",
  GALLERY: "gallery",
  EVENT_TYPES: "event_types",
  EVENT_TYPE_DATA: "event_type_data",
  BLOGS: "blogs",
  SPONSORS: "sponsors",
} as const;

export interface Project {
  $id?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  status: string;
  progress: number;
  technologies: string[];
  stars: number;
  forks: number;
  contributors: number;
  duration: string;
  isFeatured: boolean;
  demoUrl: string;
  repoUrl: string;
  teamMembers: string[];
  createdAt: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export const projectService = {
  async getAllProjects(queries: string[] = []) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        queries
      );
      return response.documents as unknown as Project[];
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  async getProjectById(projectId: string) {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectId
      );
      return response as unknown as Project;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  },

  async getProjectsByCategory(category: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [Query.equal("category", category)]
      );
      return response.documents as unknown as Project[];
    } catch (error) {
      console.error("Error fetching projects by category:", error);
      throw error;
    }
  },

  async getFeaturedProjects() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [Query.equal("isFeatured", true)]
      );
      return response.documents as unknown as Project[];
    } catch (error) {
      console.error("Error fetching featured projects:", error);
      throw error;
    }
  },

  async createProject(
    projectData: Omit<Project, "$id" | "$createdAt" | "$updatedAt">
  ) {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        ID.unique(),
        projectData
      );
      return response as unknown as Project;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async updateProject(projectId: string, projectData: Partial<Project>) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectId,
        projectData
      );
      return response as unknown as Project;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  async deleteProject(projectId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectId
      );
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }
};
