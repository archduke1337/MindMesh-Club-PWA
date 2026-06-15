"use client";

import { Card, CardContent, Avatar, Chip, Link } from "@heroui/react";
import type { Profile, MembershipStatus } from "@/lib/types";

interface UserCardProps {
  profile: Profile & { name?: string; email?: string };
  status?: MembershipStatus;
  department?: string;
  designation?: string;
  showContact?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusColors: Record<MembershipStatus, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  no_account: "default",
  account: "default",
  applicant: "warning",
  member: "success",
  core_member: "primary",
  lead: "secondary",
  head: "secondary",
  admin: "danger",
  dev: "danger",
  banned: "danger",
  deactivated: "default",
};

export function UserCard({
  profile,
  status,
  department,
  designation,
  showContact = false,
  size = "md",
}: UserCardProps) {
  const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";

  return (
    <Card className="border border-default-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar
            size={avatarSize}
            src={profile.avatar}
            name={profile.name || profile.userId}
            showFallback
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${profile.userId}`}
                className="font-semibold truncate hover:underline"
              >
                {profile.name || "Unknown User"}
              </Link>
              {status && (
                <Chip size="sm" variant="flat" color={statusColors[status]}>
                  {status}
                </Chip>
              )}
            </div>

            {profile.pronouns && (
              <p className="text-xs text-default-400">({profile.pronouns})</p>
            )}

            <div className="flex flex-wrap gap-1 mt-1">
              {department && (
                <Chip size="sm" variant="flat">
                  {department}
                </Chip>
              )}
              {designation && (
                <Chip size="sm" variant="flat" color="primary">
                  {designation}
                </Chip>
              )}
            </div>

            {showContact && profile.email && (
              <p className="text-xs text-default-400 mt-1 truncate">{profile.email}</p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-default-500 mt-3 line-clamp-2">{profile.bio}</p>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.skills.slice(0, 5).map((skill) => (
              <Chip key={skill} size="sm" variant="flat" color="default">
                {skill}
              </Chip>
            ))}
            {profile.skills.length > 5 && (
              <Chip size="sm" variant="flat" color="default">
                +{profile.skills.length - 5}
              </Chip>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
