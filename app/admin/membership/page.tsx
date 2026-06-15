"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { applicationService } from "@/lib/applications";
import { membershipService } from "@/lib/memberships";
import { profileService } from "@/lib/profiles";
import type { Application, Profile } from "@/lib/types";
import {
  Search,
  Check,
  X,
  Eye,
  Loader2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ApplicationWithProfile extends Application {
  profile?: Profile | null;
}

export default function AdminMembershipPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationWithProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onCloseReject } = useDisclosure();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!authLoading && user && !isRole("admin")) {
      router.push("/unauthorized");
    }
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const apps = await applicationService.getPending();
        const appsWithProfiles = await Promise.all(
          apps.map(async (app) => {
            const profile = await profileService.getByUserId(app.userId);
            return { ...app, profile };
          })
        );
        setApplications(appsWithProfiles);
      } catch (error) {
        console.error("Failed to load applications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && isRole("admin")) {
      loadApplications();
    }
  }, [user, authLoading, isRole]);

  const handleApprove = async (app: ApplicationWithProfile) => {
    if (!user) return;
    setActionLoading(true);

    try {
      await applicationService.approve(app.$id!, user.$id);

      await membershipService.create({
        userId: app.userId,
        applicationId: app.$id!,
        status: "active",
        approvedBy: user.$id,
        approvedAt: new Date().toISOString(),
        department: app.preferredDepartments?.[0],
        joinedAt: new Date().toISOString(),
      });

      setApplications((prev) => prev.filter((a) => a.$id !== app.$id));
      onClose();
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (app: ApplicationWithProfile) => {
    if (!user || !rejectReason.trim()) return;
    setActionLoading(true);

    try {
      await applicationService.reject(app.$id!, user.$id, rejectReason);
      setApplications((prev) => prev.filter((a) => a.$id !== app.$id));
      setRejectReason("");
      onCloseReject();
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.profile?.urn?.toLowerCase().includes(query) ||
      app.userId.toLowerCase().includes(query) ||
      app.preferredDepartments?.some((d) => d.toLowerCase().includes(query))
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Membership Applications</h1>
        <p className="text-default-500">Review and manage pending applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-default-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-warning-100">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{applications.length}</p>
              <p className="text-sm text-default-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-default-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-success-100">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-default-500">Approved Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-default-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-danger-100">
              <XCircle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-default-500">Rejected Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by URN, ID, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      {filteredApps.length === 0 ? (
        <Card className="border border-default-200">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">No Pending Applications</h3>
            <p className="text-default-500 mt-1">
              All caught up! New applications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <Card key={app.$id} className="border border-default-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {app.profile?.urn || "No URN"}
                      </h3>
                      <Chip size="sm" variant="soft" color="warning">
                        Pending
                      </Chip>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-default-500">
                      <span>User ID: {app.userId.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {app.preferredDepartments && app.preferredDepartments.length > 0 && (
                      <div className="flex gap-1">
                        {app.preferredDepartments.map((dept) => (
                          <Chip key={dept} size="sm" variant="flat">
                            {dept}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={() => setSelectedApp(app)}
                      startContent={<Eye className="w-4 h-4" />}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      color="success"
                      onClick={() => {
                        setSelectedApp(app);
                        onOpen();
                      }}
                      startContent={<Check className="w-4 h-4" />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onClick={() => {
                        setSelectedApp(app);
                        onRejectOpen();
                      }}
                      startContent={<X className="w-4 h-4" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Approve Application</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to approve this application?</p>
            {selectedApp && (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>URN:</strong> {selectedApp.profile?.urn || "N/A"}
                </p>
                <p>
                  <strong>Departments:</strong>{" "}
                  {selectedApp.preferredDepartments?.join(", ") || "N/A"}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="success"
              onClick={() => selectedApp && handleApprove(selectedApp)}
              isLoading={actionLoading}
            >
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRejectOpen} onClose={onCloseReject}>
        <ModalContent>
          <ModalHeader>Reject Application</ModalHeader>
          <ModalBody>
            <p>Please provide a reason for rejection:</p>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCloseReject}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => selectedApp && handleReject(selectedApp)}
              isLoading={actionLoading}
              isDisabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!selectedApp && !isOpen && !isRejectOpen} onClose={() => setSelectedApp(null)} size="2xl">
        <ModalContent>
          <ModalHeader>Application Details</ModalHeader>
          <ModalBody>
            {selectedApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">URN</p>
                    <p className="font-medium">{selectedApp.profile?.urn || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Phone</p>
                    <p className="font-medium">{selectedApp.profile?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Program</p>
                    <p className="font-medium">{selectedApp.profile?.program || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Branch</p>
                    <p className="font-medium">{selectedApp.profile?.branch || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Year</p>
                    <p className="font-medium">{selectedApp.profile?.year || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Semester</p>
                    <p className="font-medium">{selectedApp.profile?.semester || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1">Preferred Departments</p>
                  <div className="flex gap-1">
                    {selectedApp.preferredDepartments?.map((dept) => (
                      <Chip key={dept} size="sm" variant="flat">
                        {dept}
                      </Chip>
                    )) || "N/A"}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1">Why Join?</p>
                  <p className="text-sm">{selectedApp.profile?.whyJoin || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1">Experience</p>
                  <p className="text-sm">{selectedApp.profile?.experience || "N/A"}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-default-500">Oath Accepted</p>
                    <Chip
                      size="sm"
                      color={selectedApp.oathAccepted ? "success" : "danger"}
                    >
                      {selectedApp.oathAccepted ? "Yes" : "No"}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Terms Accepted</p>
                    <Chip
                      size="sm"
                      color={selectedApp.termsAccepted ? "success" : "danger"}
                    >
                      {selectedApp.termsAccepted ? "Yes" : "No"}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Constitution Accepted</p>
                    <Chip
                      size="sm"
                      color={selectedApp.constitutionAccepted ? "success" : "danger"}
                    >
                      {selectedApp.constitutionAccepted ? "Yes" : "No"}
                    </Chip>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={() => setSelectedApp(null)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
