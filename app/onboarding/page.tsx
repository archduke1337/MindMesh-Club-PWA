"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea, Checkbox } from "@heroui/react";
import { applicationService } from "@/lib/applications";
import { profileService } from "@/lib/profiles";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, title: "Personal Information", description: "Tell us about yourself" },
  { id: 2, title: "Academic Details", description: "Your academic background" },
  { id: 3, title: "Club Interests", description: "What excites you" },
  { id: 4, title: "Social Profiles", description: "Your online presence" },
  { id: 5, title: "Legal & Oath", description: "Terms and commitment" },
];

const DEPARTMENTS = [
  { id: "ai-ml", name: "AI/ML" }, { id: "cybersecurity", name: "Cybersecurity" },
  { id: "devops", name: "DevOps" }, { id: "web-dev", name: "Web Development" },
  { id: "social-media", name: "Social Media" }, { id: "pr-outreach", name: "PR & Outreach" },
  { id: "editorial", name: "Editorial Board" }, { id: "design", name: "Design" },
  { id: "treasury", name: "Treasury" }, { id: "events-logistics", name: "Events & Logistics" },
];

const PROGRAMS = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc", "Other"];
const BRANCHES = ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil", "Other"];
const YEARS = ["1st", "2nd", "3rd", "4th"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface FormData {
  phone: string; urn: string; dateOfBirth: string; gender: string; address: string; pronouns: string;
  program: string; branch: string; year: string; semester: string;
  preferredDepartments: string[]; whyJoin: string; experience: string; availability: string;
  githubUrl: string; linkedinUrl: string; portfolioUrl: string; bio: string;
  oathAccepted: boolean; termsAccepted: boolean; constitutionAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  phone: "", urn: "", dateOfBirth: "", gender: "", address: "", pronouns: "",
  program: "", branch: "", year: "", semester: "",
  preferredDepartments: [], whyJoin: "", experience: "", availability: "",
  githubUrl: "", linkedinUrl: "", portfolioUrl: "", bio: "",
  oathAccepted: false, termsAccepted: false, constitutionAccepted: false,
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApplication, setHasApplication] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    const checkExisting = async () => { if (!user) return; const existing = await applicationService.getByUserId(user.$id); if (existing) setHasApplication(true); };
    if (!authLoading && user) checkExisting();
  }, [user, authLoading]);

  const updateForm = (field: keyof FormData, value: unknown) => { setForm((prev) => ({ ...prev, [field]: value })); setError(null); };
  const toggleDepartment = (deptId: string) => { setForm((prev) => ({ ...prev, preferredDepartments: prev.preferredDepartments.includes(deptId) ? prev.preferredDepartments.filter((d) => d !== deptId) : [...prev.preferredDepartments, deptId] })); };

  const validateStep = (): boolean => {
    switch (step) {
      case 1: if (!form.phone || !form.urn || !form.dateOfBirth || !form.gender) { setError("Please fill in all required fields"); return false; } return true;
      case 2: if (!form.program || !form.branch || !form.year || !form.semester) { setError("Please fill in all required fields"); return false; } return true;
      case 3: if (form.preferredDepartments.length === 0) { setError("Please select at least one department"); return false; } if (!form.whyJoin || !form.availability) { setError("Please fill in all required fields"); return false; } return true;
      case 5: if (!form.oathAccepted || !form.termsAccepted || !form.constitutionAccepted) { setError("Please accept all terms to continue"); return false; } return true;
      default: return true;
    }
  };

  const handleNext = () => { if (validateStep()) setStep((prev) => Math.min(prev + 1, STEPS.length)); };
  const handleBack = () => { setStep((prev) => Math.max(prev - 1, 1)); setError(null); };

  const handleSubmit = async () => {
    if (!user || !validateStep()) return;
    setLoading(true); setError(null);
    try {
      await profileService.create({ userId: user.$id, phone: form.phone, urn: form.urn, dateOfBirth: form.dateOfBirth, gender: form.gender as "male" | "female" | "other" | "prefer_not_to_say", address: form.address || undefined, pronouns: form.pronouns as "he/him" | "she/her" | "they/them" | "he/they" | "she/they" | "prefer_to_say" | undefined, program: form.program, branch: form.branch, year: form.year, semester: form.semester, githubUrl: form.githubUrl || undefined, linkedinUrl: form.linkedinUrl || undefined, portfolioUrl: form.portfolioUrl || undefined, bio: form.bio || undefined, whyJoin: form.whyJoin, experience: form.experience || undefined, availability: form.availability as "full" | "partial" | "event_only" });
      await applicationService.create({ userId: user.$id, status: "pending", profileId: user.$id, oathAccepted: form.oathAccepted, termsAccepted: form.termsAccepted, constitutionAccepted: form.constitutionAccepted, preferredDepartments: form.preferredDepartments, submittedAt: new Date().toISOString() });
      router.push("/dashboard");
    } catch (err) { setError("Failed to submit application. Please try again."); console.error(err); }
    finally { setLoading(false); }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user) return null;
  if (hasApplication) return <div className="max-w-2xl mx-auto px-4 py-12"><Card><div className="p-8 text-center space-y-4"><div className="w-16 h-16 mx-auto rounded-full bg-[var(--success)] flex items-center justify-center"><Check className="w-8 h-8 text-white" /></div><h1 className="text-2xl font-bold">Application Submitted</h1><p className="text-[var(--muted)]">Your application is under review.</p><a href="/dashboard"><Button>Go to Dashboard</Button></a></div></Card></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2"><h1 className="text-3xl font-bold">Join Mind Mesh Club</h1><p className="text-[var(--muted)]">Complete your application to become a member</p></div>
      <div className="flex items-center justify-center gap-2">{STEPS.map((s, i) => <div key={s.id} className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > s.id ? "bg-[var(--success)] text-white" : step === s.id ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--muted)]"}`}>{step > s.id ? <Check className="w-4 h-4" /> : s.id}</div>{i < STEPS.length - 1 && <div className={`w-12 h-1 ${step > s.id ? "bg-[var(--success)]" : "bg-[var(--surface-secondary)]"}`} />}</div>)}</div>
      <div className="text-center"><h2 className="text-xl font-semibold">{STEPS[step - 1].title}</h2><p className="text-sm text-[var(--muted)]">{STEPS[step - 1].description}</p></div>
      <Card><div className="p-6 space-y-6">
        {error && <div className="p-3 rounded-lg bg-[var(--danger)] text-white text-sm">{error}</div>}
        {step === 1 && <div className="space-y-4">
          <TextField variant="secondary"><Label>Phone Number</Label><Input placeholder="+91 9876543210" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>University Roll Number</Label><Input placeholder="e.g., 2024CS001" value={form.urn} onChange={(e) => updateForm("urn", e.target.value)} /></TextField>
          <TextField variant="secondary" type="date"><Label>Date of Birth</Label><Input value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} /></TextField>
          <div className="space-y-1"><Label>Gender</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.gender} onChange={(e) => updateForm("gender", e.target.value)}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
          <div className="space-y-1"><Label>Pronouns</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.pronouns} onChange={(e) => updateForm("pronouns", e.target.value)}><option value="">Select pronouns</option><option value="he/him">he/him</option><option value="she/her">she/her</option><option value="they/them">they/them</option><option value="he/they">he/they</option><option value="she/they">she/they</option><option value="prefer_to_say">Prefer to say</option></select></div>
          <TextField variant="secondary"><Label>Address</Label><Input placeholder="Your residential address" value={form.address} onChange={(e) => updateForm("address", e.target.value)} /></TextField>
        </div>}
        {step === 2 && <div className="space-y-4">
          <div className="space-y-1"><Label>Program</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.program} onChange={(e) => updateForm("program", e.target.value)}><option value="">Select program</option>{PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
          <div className="space-y-1"><Label>Branch</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.branch} onChange={(e) => updateForm("branch", e.target.value)}><option value="">Select branch</option>{BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
          <div className="space-y-1"><Label>Year</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.year} onChange={(e) => updateForm("year", e.target.value)}><option value="">Select year</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
          <div className="space-y-1"><Label>Semester</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.semester} onChange={(e) => updateForm("semester", e.target.value)}><option value="">Select semester</option>{SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>}
        {step === 3 && <div className="space-y-6">
          <div><Label>Which departments are you interested in? (Select at least one)</Label><div className="flex flex-wrap gap-2 mt-2">{DEPARTMENTS.map((dept) => <Chip key={dept.id} variant={form.preferredDepartments.includes(dept.id) ? "primary" : "secondary"} color={form.preferredDepartments.includes(dept.id) ? "accent" : "default"} className="cursor-pointer" onClick={() => toggleDepartment(dept.id)}>{dept.name}</Chip>)}</div></div>
          <div className="space-y-1"><Label>Availability</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.availability} onChange={(e) => updateForm("availability", e.target.value)}><option value="">Select availability</option><option value="full">Full (10+ hours/week)</option><option value="partial">Partial (5-10 hours/week)</option><option value="event_only">Events only</option></select></div>
          <div className="space-y-1"><Label>Why do you want to join Mind Mesh Club?</Label><TextArea placeholder="Tell us about your motivation..." value={form.whyJoin} onChange={(e) => updateForm("whyJoin", e.target.value)} className="min-h-[100px]" /></div>
          <div className="space-y-1"><Label>Relevant Experience</Label><TextArea placeholder="Any projects, hackathons, or experience..." value={form.experience} onChange={(e) => updateForm("experience", e.target.value)} className="min-h-[80px]" /></div>
        </div>}
        {step === 4 && <div className="space-y-4">
          <TextField variant="secondary"><Label>GitHub URL</Label><Input placeholder="https://github.com/username" value={form.githubUrl} onChange={(e) => updateForm("githubUrl", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>LinkedIn URL</Label><Input placeholder="https://linkedin.com/in/username" value={form.linkedinUrl} onChange={(e) => updateForm("linkedinUrl", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>Portfolio URL</Label><Input placeholder="https://your-portfolio.com" value={form.portfolioUrl} onChange={(e) => updateForm("portfolioUrl", e.target.value)} /></TextField>
          <div className="space-y-1"><Label>Bio</Label><TextArea placeholder="A short bio about yourself..." value={form.bio} onChange={(e) => updateForm("bio", e.target.value)} className="min-h-[100px]" /></div>
        </div>}
        {step === 5 && <div className="space-y-6">
          <div className="p-4 rounded-lg bg-[var(--surface)] space-y-3"><h3 className="font-semibold">Club Oath</h3><p className="text-sm text-[var(--muted)]">I solemnly pledge to uphold the values and mission of Mind Mesh Club. I will contribute actively, maintain integrity, support fellow members, and represent the club with honor.</p></div>
          <div className="space-y-3">
            <Checkbox isSelected={form.oathAccepted} onChange={(e) => updateForm("oathAccepted", e.target.checked)}>I accept the Club Oath</Checkbox>
            <Checkbox isSelected={form.termsAccepted} onChange={(e) => updateForm("termsAccepted", e.target.checked)}>I accept the Terms of Service</Checkbox>
            <Checkbox isSelected={form.constitutionAccepted} onChange={(e) => updateForm("constitutionAccepted", e.target.checked)}>I acknowledge the Club Constitution</Checkbox>
          </div>
        </div>}
      </div></Card>
      <div className="flex justify-between">
        {step > 1 ? <Button variant="secondary" onPress={handleBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button> : <div />}
        {step < STEPS.length ? <Button variant="primary" onPress={handleNext}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button> : <Button variant="primary" onPress={handleSubmit} isDisabled={loading}>{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Submit Application</Button>}
      </div>
    </div>
  );
}
