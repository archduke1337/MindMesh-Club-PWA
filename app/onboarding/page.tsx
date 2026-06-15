"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Chip,
  Link,
} from "@heroui/react";
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
  { id: "ai-ml", name: "AI/ML" },
  { id: "cybersecurity", name: "Cybersecurity" },
  { id: "devops", name: "DevOps" },
  { id: "web-dev", name: "Web Development" },
  { id: "social-media", name: "Social Media" },
  { id: "pr-outreach", name: "PR & Outreach" },
  { id: "editorial", name: "Editorial Board" },
  { id: "design", name: "Design" },
  { id: "treasury", name: "Treasury" },
  { id: "events-logistics", name: "Events & Logistics" },
];

const PROGRAMS = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc", "Other"];

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Other",
];

const YEARS = ["1st", "2nd", "3rd", "4th"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface FormData {
  // Personal
  avatar: string;
  phone: string;
  urn: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  pronouns: string;
  // Academic
  program: string;
  branch: string;
  year: string;
  semester: string;
  // Interests
  preferredDepartments: string[];
  skills: string[];
  interests: string[];
  experience: string;
  whyJoin: string;
  availability: string;
  // Social
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  bio: string;
  // Legal
  oathAccepted: boolean;
  termsAccepted: boolean;
  constitutionAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  avatar: "",
  phone: "",
  urn: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  pronouns: "",
  program: "",
  branch: "",
  year: "",
  semester: "",
  preferredDepartments: [],
  skills: [],
  interests: [],
  experience: "",
  whyJoin: "",
  availability: "",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  bio: "",
  oathAccepted: false,
  termsAccepted: false,
  constitutionAccepted: false,
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApplication, setHasApplication] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) return;
      const existing = await applicationService.getByUserId(user.$id);
      if (existing) {
        setHasApplication(true);
      }
    };
    if (!authLoading && user) {
      checkExistingApplication();
    }
  }, [user, authLoading]);

  const updateForm = (field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleDepartment = (deptId: string) => {
    setForm((prev) => ({
      ...prev,
      preferredDepartments: prev.preferredDepartments.includes(deptId)
        ? prev.preferredDepartments.filter((d) => d !== deptId)
        : [...prev.preferredDepartments, deptId],
    }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!form.phone || !form.urn || !form.dateOfBirth || !form.gender) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;
      case 2:
        if (!form.program || !form.branch || !form.year || !form.semester) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;
      case 3:
        if (form.preferredDepartments.length === 0) {
          setError("Please select at least one department");
          return false;
        }
        if (!form.whyJoin) {
          setError("Please tell us why you want to join");
          return false;
        }
        if (!form.availability) {
          setError("Please select your availability");
          return false;
        }
        return true;
      case 5:
        if (!form.oathAccepted || !form.termsAccepted || !form.constitutionAccepted) {
          setError("Please accept all terms to continue");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      await profileService.create({
        userId: user.$id,
        avatar: form.avatar || undefined,
        phone: form.phone,
        urn: form.urn,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as "male" | "female" | "other" | "prefer_not_to_say",
        address: form.address || undefined,
        pronouns: form.pronouns as "he/him" | "she/her" | "they/them" | "he/they" | "she/they" | "prefer_to_say" | undefined,
        program: form.program,
        branch: form.branch,
        year: form.year,
        semester: form.semester,
        githubUrl: form.githubUrl || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        bio: form.bio || undefined,
        skills: form.skills.length > 0 ? form.skills : undefined,
        interests: form.interests.length > 0 ? form.interests : undefined,
        experience: form.experience || undefined,
        whyJoin: form.whyJoin,
        availability: form.availability as "full" | "partial" | "event_only",
      });

      await applicationService.create({
        userId: user.$id,
        status: "pending",
        profileId: user.$id,
        oathAccepted: form.oathAccepted,
        termsAccepted: form.termsAccepted,
        constitutionAccepted: form.constitutionAccepted,
        preferredDepartments: form.preferredDepartments,
        submittedAt: new Date().toISOString(),
      });

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to submit application. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (hasApplication) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold">Application Submitted</h1>
            <p className="text-default-500">
              Your application is under review. We&apos;ll notify you once a decision is made.
            </p>
            <Link href="/dashboard">
              <Button color="primary">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Join Mind Mesh Club</h1>
        <p className="text-default-500">Complete your application to become a member</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > s.id
                  ? "bg-success text-white"
                  : step === s.id
                  ? "bg-primary text-white"
                  : "bg-default-200 text-default-600"
              }`}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-1 ${
                  step > s.id ? "bg-success" : "bg-default-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold">{STEPS[step - 1].title}</h2>
        <p className="text-sm text-default-500">{STEPS[step - 1].description}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger-100 text-danger text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Phone Number"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                isRequired
              />
              <Input
                label="University Roll Number"
                placeholder="e.g., 2024CS001"
                value={form.urn}
                onChange={(e) => updateForm("urn", e.target.value)}
                isRequired
              />
              <Input
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                isRequired
              />
              <Select
                label="Gender"
                placeholder="Select gender"
                selectedKeys={form.gender ? [form.gender] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("gender", selected);
                }}
                isRequired
              >
                <SelectItem key="male">Male</SelectItem>
                <SelectItem key="female">Female</SelectItem>
                <SelectItem key="other">Other</SelectItem>
                <SelectItem key="prefer_not_to_say">Prefer not to say</SelectItem>
              </Select>
              <Select
                label="Pronouns"
                placeholder="Select pronouns"
                selectedKeys={form.pronouns ? [form.pronouns] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("pronouns", selected);
                }}
              >
                <SelectItem key="he/him">he/him</SelectItem>
                <SelectItem key="she/her">she/her</SelectItem>
                <SelectItem key="they/them">they/them</SelectItem>
                <SelectItem key="he/they">he/they</SelectItem>
                <SelectItem key="she/they">she/they</SelectItem>
                <SelectItem key="prefer_to_say">Prefer to say</SelectItem>
              </Select>
              <Textarea
                label="Address"
                placeholder="Your residential address"
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Select
                label="Program"
                placeholder="Select program"
                selectedKeys={form.program ? [form.program] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("program", selected);
                }}
                isRequired
              >
                {PROGRAMS.map((p) => (
                  <SelectItem key={p}>{p}</SelectItem>
                ))}
              </Select>
              <Select
                label="Branch"
                placeholder="Select branch"
                selectedKeys={form.branch ? [form.branch] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("branch", selected);
                }}
                isRequired
              >
                {BRANCHES.map((b) => (
                  <SelectItem key={b}>{b}</SelectItem>
                ))}
              </Select>
              <Select
                label="Year"
                placeholder="Select year"
                selectedKeys={form.year ? [form.year] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("year", selected);
                }}
                isRequired
              >
                {YEARS.map((y) => (
                  <SelectItem key={y}>{y}</SelectItem>
                ))}
              </Select>
              <Select
                label="Semester"
                placeholder="Select semester"
                selectedKeys={form.semester ? [form.semester] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("semester", selected);
                }}
                isRequired
              >
                {SEMESTERS.map((s) => (
                  <SelectItem key={s}>{s}</SelectItem>
                ))}
              </Select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">
                  Which departments are you interested in? (Select at least one)
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <Chip
                      key={dept.id}
                      variant={
                        form.preferredDepartments.includes(dept.id) ? "solid" : "soft"
                      }
                      color={
                        form.preferredDepartments.includes(dept.id) ? "primary" : "default"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleDepartment(dept.id)}
                    >
                      {dept.name}
                    </Chip>
                  ))}
                </div>
              </div>
              <Select
                label="Availability"
                placeholder="How much time can you commit?"
                selectedKeys={form.availability ? [form.availability] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateForm("availability", selected);
                }}
                isRequired
              >
                <SelectItem key="full">Full (10+ hours/week)</SelectItem>
                <SelectItem key="partial">Partial (5-10 hours/week)</SelectItem>
                <SelectItem key="event_only">Events only</SelectItem>
              </Select>
              <Textarea
                label="Why do you want to join Mind Mesh Club?"
                placeholder="Tell us about your motivation and what you hope to achieve..."
                value={form.whyJoin}
                onChange={(e) => updateForm("whyJoin", e.target.value)}
                isRequired
                minRows={3}
              />
              <Textarea
                label="Relevant Experience"
                placeholder="Any projects, hackathons, or experience you'd like to share..."
                value={form.experience}
                onChange={(e) => updateForm("experience", e.target.value)}
                minRows={2}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Input
                label="GitHub URL"
                placeholder="https://github.com/username"
                value={form.githubUrl}
                onChange={(e) => updateForm("githubUrl", e.target.value)}
              />
              <Input
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/username"
                value={form.linkedinUrl}
                onChange={(e) => updateForm("linkedinUrl", e.target.value)}
              />
              <Input
                label="Portfolio URL"
                placeholder="https://your-portfolio.com"
                value={form.portfolioUrl}
                onChange={(e) => updateForm("portfolioUrl", e.target.value)}
              />
              <Textarea
                label="Bio"
                placeholder="A short bio about yourself..."
                value={form.bio}
                onChange={(e) => updateForm("bio", e.target.value)}
                minRows={3}
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-default-100 space-y-3">
                <h3 className="font-semibold">Club Oath</h3>
                <p className="text-sm text-default-600">
                  I solemnly pledge to uphold the values and mission of Mind Mesh Club. I will
                  contribute actively, maintain integrity, support fellow members, and represent the
                  club with honor.
                </p>
              </div>

              <div className="space-y-3">
                <Checkbox
                  isSelected={form.oathAccepted}
                  onChange={(e) => updateForm("oathAccepted", e.target.checked)}
                >
                  I accept the Club Oath
                </Checkbox>
                <Checkbox
                  isSelected={form.termsAccepted}
                  onChange={(e) => updateForm("termsAccepted", e.target.checked)}
                >
                  I accept the Terms of Service
                </Checkbox>
                <Checkbox
                  isSelected={form.constitutionAccepted}
                  onChange={(e) => updateForm("constitutionAccepted", e.target.checked)}
                >
                  I acknowledge the Club Constitution
                </Checkbox>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {step > 1 ? (
          <Button
            variant="flat"
            onClick={handleBack}
            startContent={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.length ? (
          <Button
            color="primary"
            onClick={handleNext}
            endContent={<ArrowRight className="w-4 h-4" />}
          >
            Next
          </Button>
        ) : (
          <Button
            color="primary"
            onClick={handleSubmit}
            isLoading={loading}
            startContent={!loading && <Check className="w-4 h-4" />}
          >
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}
