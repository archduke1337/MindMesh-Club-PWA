"use client";

import { Chip } from "@heroui/react";

interface DesignationBadgeProps {
  name: string;
  level?: number;
  icon?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  variant?: "flat" | "solid" | "bordered";
}

const levelColors: Record<number, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  1: "default",
  2: "default",
  3: "default",
  4: "secondary",
  5: "secondary",
  6: "primary",
  7: "primary",
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
  variant = "flat",
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
      startContent={icon ? <span>{icon}</span> : undefined}
    >
      {name}
    </Chip>
  );
}
