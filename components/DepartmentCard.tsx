"use client";

import { Card, Chip } from "@heroui/react";
import type { Department } from "@/lib/types";

interface DepartmentCardProps {
  department: Department;
  memberCount?: number;
  eventCount?: number;
  showStats?: boolean;
}

export function DepartmentCard({ department, memberCount, eventCount, showStats = true }: DepartmentCardProps) {
  return (
    <a href={`/departments/${department.$id}`}>
      <Card className="hover:border-[var(--accent)] transition-colors cursor-pointer h-full">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {department.icon && <span className="text-2xl">{department.icon}</span>}
              <h3 className="font-semibold text-lg">{department.name}</h3>
            </div>
            <Chip color={department.category === "technical" ? "accent" : department.category === "content" ? "success" : "warning"}>{department.category}</Chip>
          </div>
          {department.description && <p className="text-sm text-[var(--muted)] line-clamp-2">{department.description}</p>}
          {showStats && (
            <div className="flex gap-4 text-sm">
              {memberCount !== undefined && <div><span className="font-semibold">{memberCount}</span><span className="text-[var(--muted)] ml-1">members</span></div>}
              {eventCount !== undefined && <div><span className="font-semibold">{eventCount}</span><span className="text-[var(--muted)] ml-1">events</span></div>}
            </div>
          )}
          {department.isActive === false && <Chip color="danger">Inactive</Chip>}
        </div>
      </Card>
    </a>
  );
}
