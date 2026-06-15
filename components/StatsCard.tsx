"use client";

import { Card, CardContent } from "@heroui/react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

const colorMap = {
  default: "text-default-600",
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  color = "default",
}: StatsCardProps) {
  return (
    <Card className="border border-default-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-default-500">{title}</p>
            <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
            {description && (
              <p className="text-xs text-default-400">{description}</p>
            )}
            {trend && (
              <p
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-success" : "text-danger"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-2 rounded-lg bg-default-100 ${colorMap[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
