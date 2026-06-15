"use client";

import { Card } from "@heroui/react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: "default" | "accent" | "success" | "warning" | "danger";
}

const colorMap = {
  default: "text-[var(--muted)]", accent: "text-[var(--accent)]",
  success: "text-[var(--success)]", warning: "text-[var(--warning)]", danger: "text-[var(--danger)]",
};

export function StatsCard({ title, value, description, icon, trend, color = "default" }: StatsCardProps) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-[var(--muted)]">{title}</p>
            <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
            {description && <p className="text-xs text-[var(--muted)]">{description}</p>}
            {trend && <p className={`text-xs font-medium ${trend.isPositive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%</p>}
          </div>
          {icon && <div className={`p-2 rounded-lg bg-[var(--surface)] ${colorMap[color]}`}>{icon}</div>}
        </div>
      </div>
    </Card>
  );
}
