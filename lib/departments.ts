import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Department, UserDepartment } from "./types";

export const departmentService = {
  async getAll(): Promise<Department[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DEPARTMENTS,
        [Query.equal("isActive", [true]), Query.orderAsc("displayOrder")]
      );
      return response.documents as unknown as Department[];
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  },

  async getById(departmentId: string): Promise<Department | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.DEPARTMENTS,
        departmentId
      );
      return response as unknown as Department;
    } catch (error) {
      console.error("Error fetching department:", error);
      return null;
    }
  },

  async create(
    department: Omit<Department, "$id" | "$createdAt" | "$updatedAt">
  ): Promise<Department> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DEPARTMENTS,
        ID.unique(),
        department
      );
      return response as unknown as Department;
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  },

  async update(
    departmentId: string,
    data: Partial<Department>
  ): Promise<Department> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DEPARTMENTS,
        departmentId,
        data
      );
      return response as unknown as Department;
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  },

  async delete(departmentId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DEPARTMENTS,
        departmentId,
        { isActive: false }
      );
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  },

  async getMembers(departmentId: string): Promise<UserDepartment[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_DEPARTMENTS,
        [
          Query.equal("departmentId", [departmentId]),
          Query.equal("isActive", [true]),
        ]
      );
      return response.documents as unknown as UserDepartment[];
    } catch (error) {
      console.error("Error fetching department members:", error);
      throw error;
    }
  },

  async addMember(
    userId: string,
    departmentId: string,
    role: "member" | "core_member" | "lead",
    assignedBy: string
  ): Promise<UserDepartment> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_DEPARTMENTS,
        ID.unique(),
        {
          userId,
          departmentId,
          role,
          assignedBy,
          assignedAt: new Date().toISOString(),
          isActive: true,
        }
      );
      return response as unknown as UserDepartment;
    } catch (error) {
      console.error("Error adding member to department:", error);
      throw error;
    }
  },

  async removeMember(userDepartmentId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_DEPARTMENTS,
        userDepartmentId,
        { isActive: false }
      );
    } catch (error) {
      console.error("Error removing member from department:", error);
      throw error;
    }
  },

  async getUserDepartments(userId: string): Promise<UserDepartment[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_DEPARTMENTS,
        [
          Query.equal("userId", [userId]),
          Query.equal("isActive", [true]),
        ]
      );
      return response.documents as unknown as UserDepartment[];
    } catch (error) {
      console.error("Error fetching user departments:", error);
      throw error;
    }
  },

  async count(): Promise<number> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DEPARTMENTS,
        [Query.limit(1)]
      );
      return response.total;
    } catch (error) {
      return 0;
    }
  },
};
