"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  resolvePermissions,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  buildUserContext,
  type UserContext,
} from "@/lib/permissions";
import type {
  MembershipStatus,
  UserPower,
  UserDepartment,
  UserDesignation,
  Power,
  Department,
  Designation,
} from "@/lib/types";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";

interface PermissionContextType {
  userContext: UserContext | null;
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (permission: string, scope?: string) => boolean;
  hasAnyPermission: (permissions: string[], scope?: string) => boolean;
  hasAllPermissions: (permissions: string[], scope?: string) => boolean;
  isRole: (role: MembershipStatus) => boolean;
  isRoleOrAbove: (role: MembershipStatus) => boolean;
  refreshPermissions: () => Promise<void>;
}

const ROLE_HIERARCHY: MembershipStatus[] = [
  "no_account",
  "account",
  "applicant",
  "member",
  "core_member",
  "lead",
  "head",
  "admin",
  "dev",
];

const PermissionContext = createContext<PermissionContextType>({
  userContext: null,
  permissions: new Set(),
  loading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isRole: () => false,
  isRoleOrAbove: () => false,
  refreshPermissions: async () => {},
});

export const usePermissions = () => useContext(PermissionContext);

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      setUserContext(null);
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    try {
      const userId = user.$id;

      const [powersDocs, departmentsDocs, designationsDocs] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_POWERS, [
          `equal("userId", ["${userId}"])`,
          `equal("isActive", [true])`,
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, [
          `equal("userId", ["${userId}"])`,
          `equal("isActive", [true])`,
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DESIGNATIONS, [
          `equal("userId", ["${userId}"])`,
          `equal("isActive", [true])`,
        ]),
      ]);

      const powers = powersDocs.documents as unknown as UserPower[];
      const departments = departmentsDocs.documents as unknown as UserDepartment[];
      const designations = designationsDocs.documents as unknown as UserDesignation[];

      const status = (user.prefs as Record<string, unknown>)?.status as MembershipStatus || "account";

      const ctx = buildUserContext({
        status,
        powers,
        departments,
        designations,
      });

      setUserContext(ctx);
      setPermissions(resolvePermissions(ctx));
    } catch (error) {
      console.error("Failed to load permissions:", error);
      setUserContext(null);
      setPermissions(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadPermissions();
    }
  }, [authLoading, loadPermissions]);

  const hasPermission = useCallback(
    (permission: string, scope?: string): boolean => {
      if (!userContext) return false;
      return checkPermission(userContext, permission, scope);
    },
    [userContext]
  );

  const hasAnyPermission = useCallback(
    (perms: string[], scope?: string): boolean => {
      if (!userContext) return false;
      return checkAnyPermission(userContext, perms, scope);
    },
    [userContext]
  );

  const hasAllPermissions = useCallback(
    (perms: string[], scope?: string): boolean => {
      if (!userContext) return false;
      return checkAllPermissions(userContext, perms, scope);
    },
    [userContext]
  );

  const isRole = useCallback(
    (role: MembershipStatus): boolean => {
      if (!userContext) return false;
      return userContext.status === role;
    },
    [userContext]
  );

  const isRoleOrAbove = useCallback(
    (role: MembershipStatus): boolean => {
      if (!userContext) return false;
      const userIndex = ROLE_HIERARCHY.indexOf(userContext.status);
      const targetIndex = ROLE_HIERARCHY.indexOf(role);
      return userIndex >= targetIndex;
    },
    [userContext]
  );

  return (
    <PermissionContext.Provider
      value={{
        userContext,
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isRole,
        isRoleOrAbove,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
