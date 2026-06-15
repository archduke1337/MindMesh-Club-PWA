"use client";

import { Chip } from "@heroui/react";

interface DesignationBadgeProps {
  name: string;
  level?: number;
  icon?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "soft" | "tertiary";
}

const levelColors: Record<number, "default" | "success" | "warning" | "danger" | "accent"> = {
  1: "default",
  2: "default",
  3: "default",
  4: "success",
  5: "success",
  6: "accent",
  7: "accent",
  8: "warning",
  9: "warning",
  10: "danger",
};

export function DesignationBadge({
  name,
  level,
  icon,
  color,
  size = "md",
  variant = "soft",
}: DesignationBadgeProps) {
  const chipColor = color
    ? undefined
    : level
    ? levelColors[level] || "default"
    : "default";

  return (
    <Chip
      size={size}
      variant={variant}
      color={chipColor}
      style={color ? { backgroundColor: color + "20", color } : undefined}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {name}
    </Chip>
  );
}
