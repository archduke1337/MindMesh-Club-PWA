/**
 * Extended User type that includes runtime-available fields
 * from the Appwrite Account service that aren't reflected in
 * the SDK's TypeScript type definitions.
 */
import type { Models } from "appwrite";

export type ExtendedUser<Preferences extends Models.Preferences = Models.DefaultPreferences> = Models.User<Preferences> & {
  email: string;
  phone: string;
  phoneVerification: boolean;
  emailVerification: boolean;
  prefs: Preferences;
  status: boolean;
  registration: string;
  accessedAt: string;
  mfa: boolean;
  targets: any[];
};

export interface Registration {
  $id?: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  registeredAt: string;
  status?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Ticket {
  $id?: string;
  registrationId: string;
  eventId: string;
  userId: string;
  ticketId: string;
  status: "issued" | "checked_in" | "invalid" | "transferred";
  issuedAt: string;
  checkedInAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Event {
  $id?: string;
  title: string;
  slug?: string;
  description: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: string;
  price: number;
  discountPrice: number | null;
  capacity: number;
  registered: number;
  organizerName: string;
  organizerAvatar: string;
  tags: string[];
  isFeatured: boolean;
  isPremium: boolean;
  status?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Profile {
  $id?: string;
  userId: string;
  urn?: string;
  program?: string;
  branch?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export type MembershipStatus = "no_account" | "account" | "applicant" | "member" | "core_member" | "lead" | "head" | "admin" | "dev" | "banned" | "deactivated";

export type Permission = string;

export interface Power {
  $id: string;
  name: string;
  description: string;
}

export interface Department {
  $id: string;
  name: string;
  description: string;
}

export interface Designation {
  $id: string;
  name: string;
  description: string;
  level: number;
}

export interface UserPower {
  powerId: string;
  isActive: boolean;
  expiresAt?: string;
}

export interface UserDepartment {
  departmentId: string;
  role: string;
  isActive: boolean;
}

export interface UserDesignation {
  designationId: string;
  isActive: boolean;
}

export interface Notification {
  $id?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  letter?: LetterData | null;
  data?: Record<string, any> | null;
  read: boolean;
  readAt?: string;
  createdAt: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface LetterData {
  template: string;
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  $id?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  timestamp: string;
  $createdAt?: string;
}
