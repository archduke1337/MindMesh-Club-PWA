"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, Chip, Input, Loader2 } from "@heroui/react";
import { DepartmentCard } from "@/components/DepartmentCard";
import { departmentService } from "@/lib/departments";
import type { Department } from "@/lib/types";
import { Search, Building2 } from "lucide-react";

export default function DepartmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await departmentService.getAll();
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to load departments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadDepartments();
    }
  }, [authLoading]);

  const filteredDepts = departments.filter((dept) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query)
    );
  });

  const technicalDepts = filteredDepts.filter((d) => d.category === "technical");
  const contentDepts = filteredDepts.filter((d) => d.category === "content");
  const operationsDepts = filteredDepts.filter((d) => d.category === "operations");

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Departments</h1>
        <p className="text-default-500">
          Explore our departments and find where you fit in
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      {filteredDepts.length === 0 ? (
        <Card className="border border-default-200">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">No Departments Found</h3>
            <p className="text-default-500 mt-1">
              {searchQuery
                ? "No departments match your search."
                : "No departments available yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {technicalDepts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Technical</h2>
                <Chip size="sm" variant="soft" color="accent">
                  {technicalDepts.length}
                </Chip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technicalDepts.map((dept) => (
                  <DepartmentCard key={dept.$id} department={dept} />
                ))}
              </div>
            </div>
          )}

          {contentDepts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Content & Communication</h2>
                <Chip size="sm" variant="soft" color="success">
                  {contentDepts.length}
                </Chip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentDepts.map((dept) => (
                  <DepartmentCard key={dept.$id} department={dept} />
                ))}
              </div>
            </div>
          )}

          {operationsDepts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Operations</h2>
                <Chip size="sm" variant="soft" color="warning">
                  {operationsDepts.length}
                </Chip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operationsDepts.map((dept) => (
                  <DepartmentCard key={dept.$id} department={dept} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
