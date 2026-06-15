"use client";

import { Card, Chip } from "@heroui/react";
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
  no_account: "default", account: "default", applicant: "warning", member: "success",
  core_member: "accent", lead: "accent", head: "accent", admin: "danger", dev: "danger", banned: "danger", deactivated: "default",
};

export function UserCard({ profile, status, department, designation, showContact = false, size = "md" }: UserCardProps) {
  const avatarSize = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted)] font-semibold ${avatarSize}`}>
            {profile.avatar ? <img src={profile.avatar} alt={profile.name || "User"} className="w-full h-full rounded-full object-cover" /> : (profile.name || profile.userId).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <a href={`/profile/${profile.userId}`} className="font-semibold truncate hover:underline">{profile.name || "Unknown User"}</a>
              {status && <Chip color={statusColors[status]}>{status}</Chip>}
            </div>
            {profile.pronouns && <p className="text-xs text-[var(--muted)]">({profile.pronouns})</p>}
            <div className="flex flex-wrap gap-1 mt-1">
              {department && <Chip>{department}</Chip>}
              {designation && <Chip color="accent">{designation}</Chip>}
            </div>
            {showContact && profile.email && <p className="text-xs text-[var(--muted)] mt-1 truncate">{profile.email}</p>}
          </div>
        </div>
        {profile.bio && <p className="text-sm text-[var(--muted)] mt-3 line-clamp-2">{profile.bio}</p>}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.skills.slice(0, 5).map((skill) => <Chip key={skill} color="default">{skill}</Chip>)}
            {profile.skills.length > 5 && <Chip color="default">+{profile.skills.length - 5}</Chip>}
          </div>
        )}
      </div>
    </Card>
  );
}
