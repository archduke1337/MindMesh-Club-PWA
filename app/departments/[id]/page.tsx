"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Chip, Button, Loader2 } from "@heroui/react";
import { departmentService } from "@/lib/departments";
import { profileService } from "@/lib/profiles";
import type { Department, UserDepartment, Profile } from "@/lib/types";
import { ArrowLeft, Users, Building2 } from "lucide-react";

interface MemberWithProfile extends UserDepartment { profile?: Profile | null; }

export default function DepartmentDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deptId = params.id as string;
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartment = async () => {
      try {
        const dept = await departmentService.getById(deptId);
        if (!dept) { router.push("/departments"); return; }
        setDepartment(dept);

        const deptMembers = await departmentService.getMembers(deptId);
        const membersWithProfiles = await Promise.all(
          deptMembers.map(async (m) => {
            const profile = await profileService.getByUserId(m.userId);
            return { ...m, profile };
          })
        );
        setMembers(membersWithProfiles);
      } catch (error) { console.error("Failed to load department:", error); }
      finally { setLoading(false); }
    };
    if (deptId) loadDepartment();
  }, [deptId, router]);

  if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!department) return null;

  const roleOrder: Record<string, number> = { lead: 0, core_member: 1, member: 2 };
  const sortedMembers = [...members].sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <Button variant="secondary" onPress={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Departments</Button>

      <Card>
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-4">
            {department.icon && <span className="text-4xl">{department.icon}</span>}
            <div>
              <h1 className="text-3xl font-bold">{department.name}</h1>
              <Chip color={department.category === "technical" ? "accent" : department.category === "content" ? "success" : "warning"}>{department.category}</Chip>
            </div>
          </div>
          {department.description && <p className="text-[var(--muted)] text-lg">{department.description}</p>}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span className="font-semibold">{members.length}</span> members</div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        {sortedMembers.length === 0 ? (
          <Card><div className="p-8 text-center"><p className="text-[var(--muted)]">No members in this department yet.</p></div></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedMembers.map((member) => (
              <Card key={member.userId}>
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center font-bold text-[var(--muted)]">
                    {member.profile?.avatar ? <img src={member.profile.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (member.profile?.urn || "M").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{member.profile?.urn || "Member"}</h3>
                    <Chip size="sm" color={member.role === "lead" ? "accent" : member.role === "core_member" ? "success" : "default"}>
                      {member.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Chip>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
