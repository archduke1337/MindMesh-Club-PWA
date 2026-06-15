"use client";

import { useEffect, useState } from "react";
import { Card, Chip, Input, Label, TextField } from "@heroui/react";
import { Loader2 } from "lucide-react";
import { departmentService } from "@/lib/departments";
import { profileService } from "@/lib/profiles";
import type { Department, Profile, UserDepartment } from "@/lib/types";
import { Search, Users, Mail, ExternalLink, Globe } from "lucide-react";

interface TeamMember {
  profile: Profile & { name?: string; email?: string };
  department: Department;
  role: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const depts = await departmentService.getAll();
        setDepartments(depts);

        const allMembers: TeamMember[] = [];
        for (const dept of depts) {
          const deptMembers = await departmentService.getMembers(dept.$id!);
          for (const ud of deptMembers) {
            const profile = await profileService.getByUserId(ud.userId);
            if (profile) {
              allMembers.push({
                profile: { ...profile, name: profile.urn || "Member" },
                department: dept,
                role: ud.role,
              });
            }
          }
        }
        setMembers(allMembers);
      } catch (error) { console.error("Failed to load team:", error); }
      finally { setLoading(false); }
    };
    loadTeam();
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchesDept = selectedDepartment === "all" || m.department.$id === selectedDepartment;
    const matchesSearch = !searchQuery || m.profile.urn?.toLowerCase().includes(searchQuery.toLowerCase()) || m.department.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const roleOrder: Record<string, number> = { lead: 0, core_member: 1, member: 2 };
  const sortedMembers = [...filteredMembers].sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Our <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--success)] bg-clip-text text-transparent">Team</span></h1>
        <p className="text-[var(--muted)]">Meet the people driving Mind Mesh Club forward</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <TextField variant="secondary" className="max-w-sm"><Label>Search</Label><Input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>
        <div className="flex flex-wrap gap-2">
          <Chip variant={selectedDepartment === "all" ? "primary" : "secondary"} color={selectedDepartment === "all" ? "accent" : "default"} className="cursor-pointer" onClick={() => setSelectedDepartment("all")}>All</Chip>
          {departments.map((dept) => (
            <Chip key={dept.$id} variant={selectedDepartment === dept.$id ? "primary" : "secondary"} color={selectedDepartment === dept.$id ? "accent" : "default"} className="cursor-pointer" onClick={() => setSelectedDepartment(dept.$id!)}>{dept.name}</Chip>
          ))}
        </div>
      </div>

      {sortedMembers.length === 0 ? (
        <Card><div className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Team Members Found</h3><p className="text-[var(--muted)] mt-1">{members.length === 0 ? "No members have been assigned to departments yet." : "No members match your search."}</p></div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMembers.map((member) => (
            <Card key={member.profile.userId} className="hover:border-[var(--accent)] transition-colors">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-xl font-bold text-[var(--muted)]">
                    {member.profile.avatar ? <img src={member.profile.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (member.profile.urn || "M").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{member.profile.urn || "Member"}</h3>
                    <p className="text-sm text-[var(--muted)]">{member.department.name}</p>
                    <Chip size="sm" color={member.role === "lead" ? "accent" : member.role === "core_member" ? "success" : "default"}>
                      {member.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Chip>
                  </div>
                </div>

                {member.profile.bio && <p className="text-sm text-[var(--muted)] line-clamp-2">{member.profile.bio}</p>}

                {member.profile.skills && member.profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.profile.skills.slice(0, 4).map((skill) => <Chip key={skill} size="sm" color="default">{skill}</Chip>)}
                    {member.profile.skills.length > 4 && <Chip size="sm" color="default">+{member.profile.skills.length - 4}</Chip>}
                  </div>
                )}

                <div className="flex gap-2">
                  {member.profile.linkedinUrl && <a href={member.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                  {member.profile.githubUrl && <a href={member.profile.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                  {member.profile.portfolioUrl && <a href={member.profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-colors"><Globe className="w-4 h-4" /></a>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
