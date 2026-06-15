"use client";

import { usePermissions } from "@/context/PermissionContext";
import type { MembershipStatus } from "@/lib/types";

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  scope?: string;
  role?: MembershipStatus;
  roleOrAbove?: MembershipStatus;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  scope,
  role,
  roleOrAbove,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isRole, isRoleOrAbove, loading } =
    usePermissions();

  if (loading) {
    return null;
  }

  let hasAccess = true;

  if (role) {
    hasAccess = isRole(role);
  } else if (roleOrAbove) {
    hasAccess = isRoleOrAbove(roleOrAbove);
  } else if (permission) {
    hasAccess = hasPermission(permission, scope);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions, scope)
      : hasAnyPermission(permissions, scope);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
