"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea, Modal } from "@heroui/react";
import { applicationService } from "@/lib/applications";
import { membershipService } from "@/lib/memberships";
import { profileService } from "@/lib/profiles";
import type { Application, Profile } from "@/lib/types";
import { Search, Check, X, Eye, Loader2, Users, Clock, CheckCircle, XCircle } from "lucide-react";

interface ApplicationWithProfile extends Application { profile?: Profile | null; }

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
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const apps = await applicationService.getPending();
        const appsWithProfiles = await Promise.all(apps.map(async (app) => {
          const profile = await profileService.getByUserId(app.userId);
          return { ...app, profile };
        }));
        setApplications(appsWithProfiles);
      } catch (error) { console.error("Failed to load applications:", error); }
      finally { setLoading(false); }
    };
    if (!authLoading && user && isRole("admin")) loadApplications();
  }, [user, authLoading, isRole]);

  const handleApprove = async (app: ApplicationWithProfile) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await applicationService.approve(app.$id!, user.$id);
      await membershipService.create({
        userId: app.userId, applicationId: app.$id!, status: "active",
        approvedBy: user.$id, approvedAt: new Date().toISOString(),
        department: app.preferredDepartments?.[0], joinedAt: new Date().toISOString(),
      });
      setApplications((prev) => prev.filter((a) => a.$id !== app.$id));
      setIsApproveOpen(false);
    } catch (error) { console.error("Failed to approve:", error); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (app: ApplicationWithProfile) => {
    if (!user || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await applicationService.reject(app.$id!, user.$id, rejectReason);
      setApplications((prev) => prev.filter((a) => a.$id !== app.$id));
      setRejectReason("");
      setIsRejectOpen(false);
    } catch (error) { console.error("Failed to reject:", error); }
    finally { setActionLoading(false); }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return app.profile?.urn?.toLowerCase().includes(query) || app.userId.toLowerCase().includes(query);
  });

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  }
  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Membership Applications</h1>
        <p className="text-[var(--muted)]">Review and manage pending applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="p-4 flex items-center gap-3"><div className="p-3 rounded-full bg-[var(--warning)]"><Clock className="w-6 h-6 text-white" /></div><div><p className="text-2xl font-bold">{applications.length}</p><p className="text-sm text-[var(--muted)]">Pending</p></div></div></Card>
        <Card><div className="p-4 flex items-center gap-3"><div className="p-3 rounded-full bg-[var(--success)]"><CheckCircle className="w-6 h-6 text-white" /></div><div><p className="text-2xl font-bold">0</p><p className="text-sm text-[var(--muted)]">Approved Today</p></div></div></Card>
        <Card><div className="p-4 flex items-center gap-3"><div className="p-3 rounded-full bg-[var(--danger)]"><XCircle className="w-6 h-6 text-white" /></div><div><p className="text-2xl font-bold">0</p><p className="text-sm text-[var(--muted)]">Rejected Today</p></div></div></Card>
      </div>

      <TextField variant="secondary" className="max-w-md"><Label>Search</Label><Input placeholder="Search by URN, ID, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>

      {filteredApps.length === 0 ? (
        <Card><div className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Pending Applications</h3><p className="text-[var(--muted)] mt-1">All caught up!</p></div></Card>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <Card key={app.$id}>
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{app.profile?.urn || "No URN"}</h3>
                    <Chip color="warning">Pending</Chip>
                  </div>
                  <div className="flex gap-2 text-sm text-[var(--muted)]">
                    <span>User: {app.userId.slice(0, 8)}...</span>
                    <span>•</span>
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                  {app.preferredDepartments && app.preferredDepartments.length > 0 && (
                    <div className="flex gap-1">{app.preferredDepartments.map((dept) => <Chip key={dept} color="default">{dept}</Chip>)}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onPress={() => { setSelectedApp(app); setIsViewOpen(true); }}><Eye className="w-4 h-4 mr-2" /> View</Button>
                  <Button variant="primary" onPress={() => { setSelectedApp(app); setIsApproveOpen(true); }}><Check className="w-4 h-4 mr-2" /> Approve</Button>
                  <Button variant="danger" onPress={() => { setSelectedApp(app); setIsRejectOpen(true); }}><X className="w-4 h-4 mr-2" /> Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Approve Application</Modal.Heading></Modal.Header>
          <Modal.Body><p>Are you sure you want to approve this application?</p></Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="primary" onPress={() => selectedApp && handleApprove(selectedApp)} isDisabled={actionLoading}>Approve</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Reject Application</Modal.Heading></Modal.Header>
          <Modal.Body>
            <Label>Reason for rejection</Label>
            <TextArea placeholder="Please provide a reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[80px]" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="danger" onPress={() => selectedApp && handleReject(selectedApp)} isDisabled={actionLoading || !rejectReason.trim()}>Reject</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isViewOpen} onOpenChange={setIsViewOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-2xl">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Application Details</Modal.Heading></Modal.Header>
          <Modal.Body>
            {selectedApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-[var(--muted)]">URN</p><p className="font-medium">{selectedApp.profile?.urn || "N/A"}</p></div>
                  <div><p className="text-sm text-[var(--muted)]">Phone</p><p className="font-medium">{selectedApp.profile?.phone || "N/A"}</p></div>
                  <div><p className="text-sm text-[var(--muted)]">Program</p><p className="font-medium">{selectedApp.profile?.program || "N/A"}</p></div>
                  <div><p className="text-sm text-[var(--muted)]">Branch</p><p className="font-medium">{selectedApp.profile?.branch || "N/A"}</p></div>
                </div>
                <div><p className="text-sm text-[var(--muted)] mb-1">Preferred Departments</p><div className="flex gap-1">{selectedApp.preferredDepartments?.map((dept) => <Chip key={dept}>{dept}</Chip>) || "N/A"}</div></div>
                <div><p className="text-sm text-[var(--muted)] mb-1">Why Join?</p><p className="text-sm">{selectedApp.profile?.whyJoin || "N/A"}</p></div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" slot="close">Close</Button></Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
