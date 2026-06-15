"use client";

import { Card, CardContent, Chip, Link } from "@heroui/react";
import type { Department } from "@/lib/types";

interface DepartmentCardProps {
  department: Department;
  memberCount?: number;
  eventCount?: number;
  showStats?: boolean;
}

const categoryColors: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  technical: "accent",
  content: "success",
  operations: "warning",
};

export function DepartmentCard({
  department,
  memberCount,
  eventCount,
  showStats = true,
}: DepartmentCardProps) {
  return (
    <Link href={`/departments/${department.$id}`}>
      <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {department.icon && (
                <span className="text-2xl">{department.icon}</span>
              )}
              <h3 className="font-semibold text-lg">{department.name}</h3>
            </div>
            <Chip
              size="sm"
              variant="soft"
              color={categoryColors[department.category] || "default"}
            >
              {department.category}
            </Chip>
          </div>

          {department.description && (
            <p className="text-sm text-default-500 line-clamp-2">
              {department.description}
            </p>
          )}

          {showStats && (
            <div className="flex gap-4 text-sm">
              {memberCount !== undefined && (
                <div>
                  <span className="font-semibold">{memberCount}</span>
                  <span className="text-default-400 ml-1">members</span>
                </div>
              )}
              {eventCount !== undefined && (
                <div>
                  <span className="font-semibold">{eventCount}</span>
                  <span className="text-default-400 ml-1">events</span>
                </div>
              )}
            </div>
          )}

          {department.isActive === false && (
            <Chip size="sm" color="danger" variant="soft">
              Inactive
            </Chip>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
