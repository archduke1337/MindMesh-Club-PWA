"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ImageGravity } from "appwrite";
import { account, storage, ID, APPWRITE_CONFIG } from "@/lib/appwrite";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";
import type { ExtendedUser, Profile, Department, UserDepartment, Designation, UserDesignation, MembershipStatus } from "@/lib/types";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback, Button, Card, CardContent, CardHeader, Chip, Input } from "@heroui/react";
import { DesignationBadge } from "@/components/DesignationBadge";
import { Activity, Globe, ExternalLink } from "lucide-react";

const { profilePicturesBucketId: PROFILE_BUCKET_ID } = APPWRITE_CONFIG;

export default function ProfilePage() {
  const { user: authUser, loading } = useAuth();
  const user = authUser as unknown as ExtendedUser | null;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [departments, setDepartments] = useState<(UserDepartment & { departmentName: string })[]>([]);
  const [designations, setDesignations] = useState<(UserDesignation & { designationName: string; designationLevel: number; designationColor?: string; designationIcon?: string })[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>("account");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      loadProfilePicture();
      loadExtendedData();
    }
  }, [user, loading, router]);

  const loadProfilePicture = () => {
    if (user?.prefs?.profilePictureId) {
      try {
        const fileUrl = storage.getFilePreview(
          PROFILE_BUCKET_ID,
          user.prefs.profilePictureId,
          400,
          400,
          ImageGravity.Center,
          100
        );
        setProfilePicture(fileUrl.toString());
      } catch (error) {
        console.error("Error loading profile picture:", error);
        setProfilePicture(getAvatarUrl(user.name));
      }
    } else {
      setProfilePicture(getAvatarUrl(user?.name || "User"));
    }
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400`;
  };

  const loadExtendedData = async () => {
    if (!user) return;
    const userId = user.$id;

    try {
      const status = (user.prefs as Record<string, unknown>)?.status as MembershipStatus || "account";
      setMembershipStatus(status);

      const [userDeptsResult, userDesigsResult, profileResult] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, [
          `equal("userId", ["${userId}"])`,
          `equal("isActive", [true])`,
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DESIGNATIONS, [
          `equal("userId", ["${userId}"])`,
          `equal("isActive", [true])`,
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
          `equal("userId", ["${userId}"])`,
          "limit(1)",
        ]),
      ]);

      const userDepts = userDeptsResult.documents as unknown as UserDepartment[];
      const userDesigs = userDesigsResult.documents as unknown as UserDesignation[];

      if (userDepts.length > 0) {
        const deptIds = userDepts.map((ud) => ud.departmentId);
        const deptsResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DEPARTMENTS, [
          Query.equal("$id", deptIds),
        ]);
        const deptMap = new Map((deptsResult.documents as unknown as Department[]).map((d) => [d.$id, d.name]));
        setDepartments(userDepts.map((ud) => ({ ...ud, departmentName: deptMap.get(ud.departmentId) || "Unknown" })));
      }

      if (userDesigs.length > 0) {
        const desigIds = userDesigs.map((ud) => ud.designationId);
        const desigsResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DESIGNATIONS, [
          Query.equal("$id", desigIds),
        ]);
        const desigMap = new Map((desigsResult.documents as unknown as Designation[]).map((d) => [d.$id, d]));
        setDesignations(userDesigs.map((ud) => {
          const desig = desigMap.get(ud.designationId);
          return {
            ...ud,
            designationName: desig?.name || "Unknown",
            designationLevel: desig?.level || 1,
            designationColor: desig?.badgeColor,
            designationIcon: desig?.badgeIcon,
          };
        }));
      }

      if (profileResult.documents.length > 0) {
        const profile = profileResult.documents[0] as unknown as Profile;
        setBio(profile.bio || "");
        setSkills(profile.skills?.join(", ") || "");
        setGithubUrl(profile.githubUrl || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setPortfolioUrl(profile.portfolioUrl || "");
      }
    } catch (error) {
      console.error("Failed to load extended profile data:", error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUpdateError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("Image size should be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    setUpdateError("");

    try {
      if (user?.prefs?.profilePictureId) {
        try {
          await storage.deleteFile(PROFILE_BUCKET_ID, user.prefs.profilePictureId);
        } catch {
          // No old picture to delete
        }
      }

      const response = await storage.createFile(PROFILE_BUCKET_ID, ID.unique(), file);

      await account.updatePrefs({
        ...user?.prefs,
        profilePictureId: response.$id,
      });

      const fileUrl = storage.getFilePreview(PROFILE_BUCKET_ID, response.$id, 400, 400, ImageGravity.Center, 100);
      setProfilePicture(fileUrl.toString());

      setUpdateSuccess(true);
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload profile picture. Please check bucket permissions.";
      setUpdateError(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess(false);
    setUpdateLoading(true);

    try {
      await account.updateName({ name });

      if (phone !== (user?.phone || "")) {
        // Phone update requires password; skip if not provided
      }

      // Update profile document with extended fields
      if (user) {
        const userId = user.$id;
        const profileResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
          `equal("userId", ["${userId}"])`,
          "limit(1)",
        ]);

        const profileData = {
          userId,
          bio,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          githubUrl: githubUrl || undefined,
          linkedinUrl: linkedinUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          phone: phone || undefined,
        };

        if (profileResult.documents.length > 0) {
          await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, profileResult.documents[0].$id, profileData);
        } else {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, ID.unique(), profileData);
        }
      }

      setUpdateSuccess(true);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setUpdateError(message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getProfileCompleteness = () => {
    const fields = [
      { filled: !!user?.name, label: "Name" },
      { filled: !!user?.email, label: "Email" },
      { filled: !!phone, label: "Phone" },
      { filled: !!bio, label: "Bio" },
      { filled: !!skills, label: "Skills" },
      { filled: !!githubUrl, label: "GitHub" },
      { filled: !!linkedinUrl, label: "LinkedIn" },
      { filled: departments.length > 0, label: "Department" },
      { filled: designations.length > 0, label: "Designation" },
    ];
    const filledCount = fields.filter((f) => f.filled).length;
    return { filledCount, total: fields.length, percentage: Math.round((filledCount / fields.length) * 100) };
  };

  const completeness = getProfileCompleteness();

  const statusColorMap: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
    account: "default",
    applicant: "warning",
    member: "success",
    core_member: "accent",
    lead: "accent",
    head: "danger",
    admin: "danger",
    dev: "danger",
    banned: "danger",
    deactivated: "default",
  };

  const statusLabelMap: Record<string, string> = {
    account: "Account Holder",
    applicant: "Applicant",
    member: "Member",
    core_member: "Core Member",
    lead: "Lead",
    head: "Head",
    admin: "Admin",
    dev: "Developer",
    banned: "Banned",
    deactivated: "Deactivated",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-200px)] py-8 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-4 items-center pt-8">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profilePicture} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <Button
              isIconOnly
              size="sm"
              className="absolute bottom-0 right-0 shadow-lg"
              isPending={uploadingPhoto}
              onPress={handleFileSelect}
            >
              {!uploadingPhoto && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              title="Upload profile picture"
              placeholder="Select an image"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-default-500">{user.email}</p>
            {user.phone && <p className="text-default-500 text-sm">{user.phone}</p>}
            <Chip variant="primary" size="sm" className="mt-2" color={statusColorMap[membershipStatus] || "default"}>
              {statusLabelMap[membershipStatus] || membershipStatus}
            </Chip>
          </div>
          {departments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {departments.map((dept) => (
                <Chip key={dept.$id} size="sm" variant="soft" color="success">{dept.departmentName}</Chip>
              ))}
            </div>
          )}
          {designations.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {designations.map((desig) => (
                <DesignationBadge
                  key={desig.$id}
                  name={desig.designationName}
                  level={desig.designationLevel}
                  icon={desig.designationIcon}
                  color={desig.designationColor}
                  size="sm"
                />
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="gap-6 px-4 md:px-8 pb-8">
          {updateError && (
            <div className={`p-3 rounded-lg text-sm ${updateSuccess ? "bg-success-50 text-success-700 dark:bg-success-900/20" : "bg-danger-50 text-danger-700 dark:bg-danger-900/20"}`}>
              {updateError}
            </div>
          )}

          <div className="border-t border-divider pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Profile Completeness</h2>
              <span className="text-sm font-medium text-[var(--accent)]">{completeness.percentage}%</span>
            </div>
            <div className="w-full bg-default-200 rounded-full h-2">
              <div className="bg-[var(--accent)] h-2 rounded-full transition-all duration-500" style={{ width: `${completeness.percentage}%` }} />
            </div>
            <p className="text-xs text-default-500 mt-1">{completeness.filledCount}/{completeness.total} fields completed</p>
          </div>

          <div className="border-t border-divider pt-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-default-500">User ID</label>
                <p className="text-xs md:text-sm font-mono bg-default-100 p-2 rounded-lg break-all">{user.$id}</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-default-500">Email</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm p-2 break-all">{user.email}</p>
                  <Chip color={user.emailVerification ? "success" : "warning"} variant="primary" size="sm">
                    {user.emailVerification ? "Verified" : "Not Verified"}
                  </Chip>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-default-500">Phone Number</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm p-2">{user.phone || "Not added"}</p>
                  <Chip color={user.phoneVerification ? "success" : "warning"} variant="primary" size="sm">
                    {user.phoneVerification ? "Verified" : "Not Verified"}
                  </Chip>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-default-500">Account Created</label>
                <p className="text-sm p-2">
                  {new Date(user.$createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-divider pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Profile Details</h2>
              <div className="flex gap-2">
                <a href="/profile/history">
                  <Button size="sm" variant="ghost"><Activity className="w-4 h-4 mr-1" /> History</Button>
                </a>
                {!isEditing && (
                  <Button size="sm" variant="primary" onPress={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-default-500">Name</label>
                  <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Enter your name" required disabled={updateLoading} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-default-500">Phone</label>
                  <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="Enter phone number" disabled={updateLoading} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-default-500">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full p-2 border border-divider rounded-lg text-sm min-h-[80px] bg-default-100"
                    disabled={updateLoading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-default-500">Skills (comma separated)</label>
                  <Input value={skills} onChange={(e: any) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" disabled={updateLoading} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-default-500">GitHub URL</label>
                  <Input value={githubUrl} onChange={(e: any) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" disabled={updateLoading} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-default-500">LinkedIn URL</label>
                  <Input value={linkedinUrl} onChange={(e: any) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" disabled={updateLoading} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-default-500">Portfolio URL</label>
                  <Input value={portfolioUrl} onChange={(e: any) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" disabled={updateLoading} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" isPending={updateLoading}>Save Changes</Button>
                  <Button size="sm" className="w-full font-medium" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-default-500">Name</label>
                  <p className="text-sm p-2">{user.name}</p>
                </div>
                {bio && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-default-500">Bio</label>
                    <p className="text-sm p-2">{bio}</p>
                  </div>
                )}
                {skills && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-default-500">Skills</label>
                    <div className="flex flex-wrap gap-1 p-2">
                      {skills.split(",").filter(Boolean).map((skill, i) => (
                        <Chip key={i} size="sm" variant="soft">{skill.trim()}</Chip>
                      ))}
                    </div>
                  </div>
                )}
                {(githubUrl || linkedinUrl || portfolioUrl) && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-default-500">Links</label>
                    <div className="flex flex-wrap gap-2 p-2">
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                          <ExternalLink className="w-4 h-4" /> GitHub
                        </a>
                      )}
                      {linkedinUrl && (
                        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                          <ExternalLink className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                      {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                          <Globe className="w-4 h-4" /> Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
