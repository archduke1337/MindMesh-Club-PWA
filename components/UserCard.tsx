"use client";

import { Card, CardContent, Chip, Link } from "@heroui/react";
import type { Profile, MembershipStatus } from "@/lib/types";

interface UserCardProps {
  profile: Profile & { name?: string; email?: string };
  status?: MembershipStatus;
  department?: string;
  designation?: string;
  showContact?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusColors: Record<MembershipStatus, "default" | "success" | "warning" | "danger" | "accent"> = {
  no_account: "default",
  account: "default",
  applicant: "warning",
  member: "success",
  core_member: "accent",
  lead: "accent",
  head: "accent",
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
          <div
            className={`flex items-center justify-center rounded-full bg-default-200 text-default-600 font-semibold ${
              avatarSize === "sm" ? "w-8 h-8 text-xs" : avatarSize === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm"
            }`}
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (profile.name || profile.userId).charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${profile.userId}`}
                className="font-semibold truncate hover:underline"
              >
                {profile.name || "Unknown User"}
              </Link>
              {status && (
                <Chip size="sm" variant="soft" color={statusColors[status]}>
                  {status}
                </Chip>
              )}
            </div>

            {profile.pronouns && (
              <p className="text-xs text-default-400">({profile.pronouns})</p>
            )}

            <div className="flex flex-wrap gap-1 mt-1">
              {department && (
                <Chip size="sm" variant="soft">
                  {department}
                </Chip>
              )}
              {designation && (
                <Chip size="sm" variant="soft" color="accent">
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
              <Chip key={skill} size="sm" variant="soft" color="default">
                {skill}
              </Chip>
            ))}
            {profile.skills.length > 5 && (
              <Chip size="sm" variant="soft" color="default">
                +{profile.skills.length - 5}
              </Chip>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
