#!/usr/bin/env node
// ============================================================
// MindMesh Appwrite Setup Script
// Creates: 1 database, 22 collections, indexes, 7 storage buckets
// Run: node scripts/setup-appwrite.js
// ============================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read API key from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const apiKeyMatch = envContent.match(/NEXT_PUBLIC_APPWRITE_API_KEY\s*=\s*(.+)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!API_KEY) {
  console.error("Error: NEXT_PUBLIC_APPWRITE_API_KEY not found in .env.local");
  process.exit(1);
}

const DB_ID = "mindmesh_db";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = "6a0a45a700360d3f9f6b";

let success = 0;
let failed = 0;
let skipped = 0;

function run(args) {
  try {
    const cmd = `appwrite ${args.join(" ")}`;
    execSync(cmd, { stdio: "pipe", timeout: 30000 });
    return true;
  } catch (err) {
    const msg = err.stderr?.toString() || err.stdout?.toString() || err.message;
    if (msg.includes("already exists")) return true;
    return false;
  }
}

function runVerbose(args) {
  try {
    const cmd = `appwrite ${args.join(" ")}`;
    execSync(cmd, { stdio: "pipe", timeout: 30000 });
    return true;
  } catch (err) {
    const msg = err.stderr?.toString() || err.stdout?.toString() || err.message;
    if (msg.includes("already exists")) return true;
    console.log(`    Error: ${msg.substring(0, 200)}`);
    return false;
  }
}

function log(emoji, msg) {
  const colors = { ok: "\x1b[32m", fail: "\x1b[31m", skip: "\x1b[33m", step: "\x1b[36m" };
  const c = colors[emoji] || "";
  const prefix = { ok: "[OK]", fail: "[FAIL]", skip: "[SKIP]", step: ">>>" }[emoji] || "";
  console.log(`${c}  ${prefix} ${msg}\x1b[0m`);
  if (emoji === "ok") success++;
  if (emoji === "fail") failed++;
  if (emoji === "skip") skipped++;
}

function createTable(id, name, columns, indexes = []) {
  log("step", `Creating table: ${name} (${id})`);

  const colsJson = JSON.stringify(columns);
  const idxJson = JSON.stringify(indexes);

  const args = [
    "tables-db", "create-table",
    "--database-id", DB_ID,
    "--table-id", id,
    "--name", name,
    "--row-security", "false",
    "--enabled", "true",
    "--columns", `'${colsJson}'`,
  ];

  if (indexes.length > 0) {
    args.push("--indexes", `'${idxJson}'`);
  }

  const ok = run(args);
  log(ok ? "ok" : "fail", `Table '${name}'`);
}

function createBucket(id, name, maxSize, extensions) {
  log("step", `Creating bucket: ${name} (${id})`);

  const extArgs = extensions.map((e) => `--allowed-file-extensions ${e}`).join(" ");

  const args = [
    "storage", "create-bucket",
    "--bucket-id", id,
    "--name", name,
    "--permissions", `'read("any")'`, `'write("users")'`,
    "--file-security", "true",
    "--enabled", "true",
    "--maximum-file-size", String(maxSize),
    "--compression", "gzip",
    "--encryption", "true",
    "--antivirus", "true",
    "--transformations", "true",
    extArgs,
  ];

  const ok = run(args);
  log(ok ? "ok" : "fail", `Bucket '${name}'`);
}

// ============================================================
// START
// ============================================================
console.log("\n\x1b[35m============================================\x1b[0m");
console.log("\x1b[35m  MindMesh Appwrite Database Setup\x1b[0m");
console.log("\x1b[35m============================================\x1b[0m");
console.log(`  Endpoint : ${ENDPOINT}`);
console.log(`  Project  : ${PROJECT_ID}`);
console.log(`  Database : ${DB_ID}`);

// Set client
run(["client", "--endpoint", ENDPOINT, "--project-id", PROJECT_ID]);

// Create database
log("step", `Creating database: ${DB_ID}`);
const dbOk = run(["tables-db", "create", "--database-id", DB_ID, "--name", "MindMesh Club"]);
log(dbOk ? "ok" : "fail", "Database");

// ============================================================
// TABLES
// ============================================================

createTable("events", "Events", [
  { key: "title", type: "varchar", size: 255, required: true },
  { key: "slug", type: "varchar", size: 255, required: true },
  { key: "description", type: "text", required: true },
  { key: "image", type: "varchar", size: 500, required: false },
  { key: "eventTypeId", type: "varchar", size: 36, required: true },
  { key: "status", type: "enum", elements: ["draft", "review", "approved", "published", "active", "completed", "cancelled"], required: true },
  { key: "audience", type: "enum", elements: ["public", "member_only", "exclusive"], required: true },
  { key: "date", type: "varchar", size: 30, required: true },
  { key: "time", type: "varchar", size: 30, required: true },
  { key: "endDate", type: "varchar", size: 30, required: false },
  { key: "venue", type: "varchar", size: 255, required: true },
  { key: "location", type: "varchar", size: 500, required: true },
  { key: "capacity", type: "integer", required: true },
  { key: "registered", type: "integer", required: true },
  { key: "price", type: "float", required: true },
  { key: "discountPrice", type: "float", required: false },
  { key: "organizerName", type: "varchar", size: 255, required: true },
  { key: "organizerAvatar", type: "varchar", size: 500, required: false },
  { key: "ownerId", type: "varchar", size: 36, required: true },
  { key: "approvedBy", type: "varchar", size: 36, required: false },
  { key: "approvedAt", type: "varchar", size: 30, required: false },
  { key: "publishedAt", type: "varchar", size: 30, required: false },
  { key: "tags", type: "varchar", size: 255, required: false, array: true },
  { key: "isFeatured", type: "boolean", required: true },
  { key: "isPremium", type: "boolean", required: true },
  { key: "eventDocs", type: "text", required: false },
  { key: "externalLinks", type: "text", required: false },
  { key: "materials", type: "text", required: false },
  { key: "registrationUrl", type: "varchar", size: 500, required: false },
  { key: "eventWebsite", type: "varchar", size: 500, required: false },
  { key: "contactEmail", type: "email", required: false },
], [
  { key: "idx_status", type: "key", columns: ["status"] },
  { key: "idx_date", type: "key", columns: ["date"] },
  { key: "idx_owner", type: "key", columns: ["ownerId"] },
  { key: "idx_featured", type: "key", columns: ["isFeatured"] },
]);

createTable("registrations", "Registrations", [
  { key: "eventId", type: "varchar", size: 36, required: true },
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "status", type: "enum", elements: ["pending", "approved", "rejected", "cancelled", "waitlisted"], required: true },
  { key: "registeredAt", type: "varchar", size: 30, required: true },
  { key: "approvedBy", type: "varchar", size: 36, required: false },
  { key: "approvedAt", type: "varchar", size: 30, required: false },
  { key: "rejectionReason", type: "text", required: false },
  { key: "metadata", type: "text", required: false },
], [
  { key: "idx_event", type: "key", columns: ["eventId"] },
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_status", type: "key", columns: ["status"] },
  { key: "idx_registered", type: "key", columns: ["registeredAt"] },
]);

createTable("projects", "Projects", [
  { key: "title", type: "varchar", size: 255, required: true },
  { key: "description", type: "text", required: true },
  { key: "image", type: "varchar", size: 500, required: true },
  { key: "category", type: "varchar", size: 100, required: true },
  { key: "status", type: "varchar", size: 50, required: true },
  { key: "progress", type: "integer", required: true },
  { key: "technologies", type: "varchar", size: 100, required: false, array: true },
  { key: "stars", type: "integer", required: true },
  { key: "forks", type: "integer", required: true },
  { key: "contributors", type: "integer", required: true },
  { key: "duration", type: "varchar", size: 100, required: true },
  { key: "isFeatured", type: "boolean", required: true },
  { key: "demoUrl", type: "varchar", size: 500, required: true },
  { key: "repoUrl", type: "varchar", size: 500, required: true },
  { key: "teamMembers", type: "varchar", size: 255, required: false, array: true },
  { key: "createdAt", type: "varchar", size: 30, required: true },
], [
  { key: "idx_category", type: "key", columns: ["category"] },
  { key: "idx_featured", type: "key", columns: ["isFeatured"] },
]);

createTable("profiles", "Profiles", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "avatar", type: "varchar", size: 500, required: false },
  { key: "pronouns", type: "enum", elements: ["he/him", "she/her", "they/them", "he/they", "she/they", "prefer_to_say"], required: false },
  { key: "phone", type: "varchar", size: 20, required: false },
  { key: "urn", type: "varchar", size: 50, required: false },
  { key: "program", type: "varchar", size: 100, required: false },
  { key: "branch", type: "varchar", size: 100, required: false },
  { key: "year", type: "varchar", size: 20, required: false },
  { key: "semester", type: "varchar", size: 20, required: false },
  { key: "address", type: "text", required: false },
  { key: "dateOfBirth", type: "varchar", size: 30, required: false },
  { key: "gender", type: "enum", elements: ["male", "female", "other", "prefer_not_to_say"], required: false },
  { key: "githubUrl", type: "varchar", size: 500, required: false },
  { key: "linkedinUrl", type: "varchar", size: 500, required: false },
  { key: "portfolioUrl", type: "varchar", size: 500, required: false },
  { key: "bio", type: "text", required: false },
  { key: "skills", type: "varchar", size: 100, required: false, array: true },
  { key: "interests", type: "varchar", size: 100, required: false, array: true },
  { key: "experience", type: "text", required: false },
  { key: "whyJoin", type: "text", required: false },
  { key: "availability", type: "enum", elements: ["full", "partial", "event_only"], required: false },
  { key: "profileVisibility", type: "enum", elements: ["public", "members_only", "private"], required: false },
  { key: "showOnAboutPage", type: "boolean", required: false },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
]);

createTable("applications", "Applications", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "status", type: "enum", elements: ["pending", "approved", "rejected", "reapplied"], required: true },
  { key: "profileId", type: "varchar", size: 36, required: true },
  { key: "oathAccepted", type: "boolean", required: true },
  { key: "termsAccepted", type: "boolean", required: true },
  { key: "constitutionAccepted", type: "boolean", required: true },
  { key: "preferredDepartments", type: "varchar", size: 100, required: false, array: true },
  { key: "reviewedBy", type: "varchar", size: 36, required: false },
  { key: "reviewedAt", type: "varchar", size: 30, required: false },
  { key: "rejectionReason", type: "text", required: false },
  { key: "submittedAt", type: "varchar", size: 30, required: true },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_status", type: "key", columns: ["status"] },
  { key: "idx_submitted", type: "key", columns: ["submittedAt"] },
]);

createTable("memberships", "Memberships", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "applicationId", type: "varchar", size: 36, required: true },
  { key: "status", type: "enum", elements: ["active", "inactive", "suspended", "banned"], required: true },
  { key: "membershipNumber", type: "varchar", size: 20, required: true },
  { key: "approvedBy", type: "varchar", size: 36, required: true },
  { key: "approvedAt", type: "varchar", size: 30, required: true },
  { key: "department", type: "varchar", size: 100, required: false },
  { key: "joinedAt", type: "varchar", size: 30, required: true },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_status", type: "key", columns: ["status"] },
  { key: "idx_joined", type: "key", columns: ["joinedAt"] },
]);

createTable("departments", "Departments", [
  { key: "name", type: "varchar", size: 100, required: true },
  { key: "slug", type: "varchar", size: 100, required: true },
  { key: "description", type: "text", required: false },
  { key: "icon", type: "varchar", size: 100, required: false },
  { key: "color", type: "varchar", size: 20, required: false },
  { key: "parentId", type: "varchar", size: 36, required: false },
  { key: "headId", type: "varchar", size: 36, required: false },
  { key: "isActive", type: "boolean", required: true },
  { key: "displayOrder", type: "integer", required: false },
  { key: "category", type: "enum", elements: ["technical", "content", "operations"], required: true },
], [
  { key: "idx_active", type: "key", columns: ["isActive"] },
  { key: "idx_order", type: "key", columns: ["displayOrder"] },
]);

createTable("user_departments", "User Departments", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "departmentId", type: "varchar", size: 36, required: true },
  { key: "role", type: "enum", elements: ["member", "core_member", "lead"], required: true },
  { key: "assignedBy", type: "varchar", size: 36, required: true },
  { key: "assignedAt", type: "varchar", size: 30, required: true },
  { key: "isActive", type: "boolean", required: true },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_dept", type: "key", columns: ["departmentId"] },
  { key: "idx_active", type: "key", columns: ["isActive"] },
]);

createTable("designations", "Designations", [
  { key: "name", type: "varchar", size: 100, required: true },
  { key: "slug", type: "varchar", size: 100, required: true },
  { key: "description", type: "text", required: false },
  { key: "level", type: "integer", required: true },
  { key: "category", type: "enum", elements: ["department", "operations", "executive", "special"], required: true },
  { key: "departmentId", type: "varchar", size: 36, required: false },
  { key: "badgeIcon", type: "varchar", size: 100, required: false },
  { key: "badgeColor", type: "varchar", size: 20, required: false },
  { key: "isActive", type: "boolean", required: true },
  { key: "maxHolders", type: "integer", required: false },
], [
  { key: "idx_active", type: "key", columns: ["isActive"] },
  { key: "idx_level", type: "key", columns: ["level"] },
]);

createTable("user_designations", "User Designations", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "designationId", type: "varchar", size: 36, required: true },
  { key: "assignedBy", type: "varchar", size: 36, required: true },
  { key: "assignedAt", type: "varchar", size: 30, required: true },
  { key: "revokedAt", type: "varchar", size: 30, required: false },
  { key: "revokedBy", type: "varchar", size: 36, required: false },
  { key: "isActive", type: "boolean", required: true },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_active", type: "key", columns: ["isActive"] },
]);

createTable("powers", "Powers", [
  { key: "name", type: "varchar", size: 100, required: true },
  { key: "displayName", type: "varchar", size: 100, required: true },
  { key: "description", type: "text", required: false },
  { key: "category", type: "enum", elements: ["membership", "events", "tickets", "content", "resources", "admin", "gallery", "social"], required: true },
  { key: "scope", type: "enum", elements: ["global", "department", "own"], required: true },
], [
  { key: "idx_name", type: "key", columns: ["name"] },
]);

createTable("user_powers", "User Powers", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "powerId", type: "varchar", size: 36, required: true },
  { key: "grantedBy", type: "varchar", size: 36, required: true },
  { key: "grantedAt", type: "varchar", size: 30, required: true },
  { key: "departmentId", type: "varchar", size: 36, required: false },
  { key: "expiresAt", type: "varchar", size: 30, required: false },
  { key: "isActive", type: "boolean", required: true },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_active", type: "key", columns: ["isActive"] },
]);

createTable("tickets", "Tickets", [
  { key: "eventId", type: "varchar", size: 36, required: true },
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "registrationId", type: "varchar", size: 36, required: true },
  { key: "ticketCode", type: "varchar", size: 20, required: true },
  { key: "qrData", type: "text", required: true },
  { key: "status", type: "enum", elements: ["pending", "issued", "active", "checked_in", "completed", "invalidated", "transferred", "waitlisted"], required: true },
  { key: "issuedAt", type: "varchar", size: 30, required: false },
  { key: "checkedInAt", type: "varchar", size: 30, required: false },
  { key: "checkedInBy", type: "varchar", size: 36, required: false },
  { key: "invalidatedAt", type: "varchar", size: 30, required: false },
  { key: "invalidatedReason", type: "text", required: false },
  { key: "transferredTo", type: "varchar", size: 36, required: false },
  { key: "transferHistory", type: "text", required: false },
  { key: "entryCount", type: "integer", required: true },
  { key: "maxEntries", type: "integer", required: true },
  { key: "metadata", type: "text", required: false },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_event", type: "key", columns: ["eventId"] },
  { key: "idx_issued", type: "key", columns: ["issuedAt"] },
]);

createTable("ticket_verifications", "Ticket Verifications", [
  { key: "ticketId", type: "varchar", size: 36, required: true },
  { key: "eventId", type: "varchar", size: 36, required: true },
  { key: "verifiedBy", type: "varchar", size: 36, required: true },
  { key: "method", type: "enum", elements: ["qr_scan", "manual_search", "manual_entry"], required: true },
  { key: "result", type: "enum", elements: ["success", "already_checked_in", "invalid_ticket", "event_not_active"], required: true },
  { key: "verifiedAt", type: "varchar", size: 30, required: true },
  { key: "metadata", type: "text", required: false },
]);

createTable("resources", "Resources", [
  { key: "title", type: "varchar", size: 255, required: true },
  { key: "description", type: "text", required: false },
  { key: "type", type: "enum", elements: ["document", "link", "video", "file", "announcement"], required: true },
  { key: "url", type: "varchar", size: 500, required: false },
  { key: "fileId", type: "varchar", size: 36, required: false },
  { key: "layer", type: "enum", elements: ["common", "department", "role"], required: true },
  { key: "departmentId", type: "varchar", size: 36, required: false },
  { key: "designationId", type: "varchar", size: 36, required: false },
  { key: "tags", type: "varchar", size: 100, required: false, array: true },
  { key: "uploadedBy", type: "varchar", size: 36, required: true },
  { key: "isActive", type: "boolean", required: true },
  { key: "displayOrder", type: "integer", required: false },
  { key: "category", type: "enum", elements: ["common", "department", "role"], required: true },
  { key: "requiredRole", type: "varchar", size: 100, required: false },
  { key: "uploadedByName", type: "varchar", size: 255, required: true },
  { key: "downloads", type: "integer", required: true },
], [
  { key: "idx_active", type: "key", columns: ["isActive"] },
  { key: "idx_category", type: "key", columns: ["category"] },
  { key: "idx_dept", type: "key", columns: ["departmentId"] },
  { key: "idx_role", type: "key", columns: ["requiredRole"] },
]);

createTable("notifications", "Notifications", [
  { key: "userId", type: "varchar", size: 36, required: true },
  { key: "type", type: "varchar", size: 100, required: true },
  { key: "title", type: "varchar", size: 255, required: true },
  { key: "body", type: "text", required: true },
  { key: "letter", type: "text", required: false },
  { key: "data", type: "text", required: false },
  { key: "read", type: "boolean", required: true },
  { key: "readAt", type: "varchar", size: 30, required: false },
  { key: "createdAt", type: "varchar", size: 30, required: true },
], [
  { key: "idx_user", type: "key", columns: ["userId"] },
  { key: "idx_read", type: "key", columns: ["read"] },
  { key: "idx_created", type: "key", columns: ["createdAt"] },
]);

createTable("audit_logs", "Audit Logs", [
  { key: "actorId", type: "varchar", size: 36, required: true },
  { key: "actorName", type: "varchar", size: 255, required: true },
  { key: "actorRole", type: "varchar", size: 50, required: true },
  { key: "action", type: "varchar", size: 100, required: true },
  { key: "entityType", type: "varchar", size: 50, required: true },
  { key: "entityId", type: "varchar", size: 36, required: true },
  { key: "details", type: "text", required: false },
  { key: "ipAddress", type: "varchar", size: 45, required: false },
  { key: "userAgent", type: "text", required: false },
  { key: "timestamp", type: "varchar", size: 30, required: true },
], [
  { key: "idx_actor", type: "key", columns: ["actorId"] },
  { key: "idx_entity", type: "key", columns: ["entityType", "entityId"] },
  { key: "idx_action", type: "key", columns: ["action"] },
  { key: "idx_timestamp", type: "key", columns: ["timestamp"] },
]);

createTable("gallery", "Gallery", [
  { key: "title", type: "varchar", size: 255, required: true },
  { key: "description", type: "text", required: false },
  { key: "imageUrl", type: "varchar", size: 500, required: true },
  { key: "thumbnailUrl", type: "varchar", size: 500, required: false },
  { key: "category", type: "enum", elements: ["events", "workshops", "hackathons", "team", "projects", "other"], required: true },
  { key: "uploadedBy", type: "varchar", size: 36, required: true },
  { key: "eventId", type: "varchar", size: 36, required: false },
  { key: "departmentId", type: "varchar", size: 36, required: false },
  { key: "status", type: "enum", elements: ["pending", "approved", "rejected"], required: true },
  { key: "approvedBy", type: "varchar", size: 36, required: false },
  { key: "approvedAt", type: "varchar", size: 30, required: false },
  { key: "rejectionReason", type: "text", required: false },
  { key: "tags", type: "varchar", size: 100, required: false, array: true },
  { key: "isActive", type: "boolean", required: true },
  { key: "displayOrder", type: "integer", required: false },
], [
  { key: "idx_status", type: "key", columns: ["status"] },
  { key: "idx_category", type: "key", columns: ["category"] },
  { key: "idx_active", type: "key", columns: ["isActive"] },
  { key: "idx_order", type: "key", columns: ["displayOrder"] },
]);

createTable("approval_workflows", "Approval Workflows", [
  { key: "entityType", type: "enum", elements: ["membership", "event", "registration", "promotion", "department_assignment"], required: true },
  { key: "entityId", type: "varchar", size: 36, required: true },
  { key: "currentStep", type: "integer", required: true },
  { key: "totalSteps", type: "integer", required: true },
  { key: "steps", type: "text", required: true },
  { key: "status", type: "enum", elements: ["pending", "in_progress", "approved", "rejected"], required: true },
  { key: "initiatedBy", type: "varchar", size: 36, required: true },
  { key: "initiatedAt", type: "varchar", size: 30, required: true },
  { key: "completedAt", type: "varchar", size: 30, required: false },
]);

createTable("event_types", "Event Types", [
  { key: "name", type: "varchar", size: 100, required: true },
  { key: "displayName", type: "varchar", size: 100, required: true },
  { key: "description", type: "text", required: false },
  { key: "icon", type: "varchar", size: 100, required: false },
  { key: "fields", type: "text", required: true },
  { key: "registrationConfig", type: "text", required: true },
  { key: "ticketConfig", type: "text", required: true },
  { key: "workflowConfig", type: "text", required: true },
  { key: "isActive", type: "boolean", required: true },
  { key: "displayOrder", type: "integer", required: false },
], [
  { key: "idx_name", type: "key", columns: ["name"] },
  { key: "idx_active", type: "key", columns: ["isActive"] },
  { key: "idx_order", type: "key", columns: ["displayOrder"] },
]);

createTable("event_type_data", "Event Type Data", [
  { key: "eventId", type: "varchar", size: 36, required: true },
  { key: "eventTypeId", type: "varchar", size: 36, required: true },
  { key: "fieldData", type: "text", required: true },
], [
  { key: "idx_event", type: "key", columns: ["eventId"] },
]);

createTable("blogs", "Blogs", [
  { key: "title", type: "varchar", size: 255, required: true },
  { key: "slug", type: "varchar", size: 255, required: true },
  { key: "excerpt", type: "varchar", size: 500, required: true },
  { key: "content", type: "text", required: true },
  { key: "coverImage", type: "varchar", size: 500, required: true },
  { key: "category", type: "varchar", size: 100, required: true },
  { key: "tags", type: "varchar", size: 100, required: false, array: true },
  { key: "authorId", type: "varchar", size: 36, required: true },
  { key: "authorName", type: "varchar", size: 255, required: true },
  { key: "authorEmail", type: "email", required: true },
  { key: "authorAvatar", type: "varchar", size: 500, required: false },
  { key: "status", type: "enum", elements: ["draft", "pending", "approved", "rejected"], required: true },
  { key: "rejectionReason", type: "text", required: false },
  { key: "publishedAt", type: "varchar", size: 30, required: false },
  { key: "views", type: "integer", required: true },
  { key: "likes", type: "integer", required: true },
  { key: "featured", type: "boolean", required: true },
  { key: "readTime", type: "integer", required: true },
], [
  { key: "idx_status", type: "key", columns: ["status"] },
  { key: "idx_slug", type: "unique", columns: ["slug"] },
  { key: "idx_category", type: "key", columns: ["category"] },
  { key: "idx_author", type: "key", columns: ["authorId"] },
  { key: "idx_featured", type: "key", columns: ["featured"] },
  { key: "idx_published", type: "key", columns: ["publishedAt"] },
]);

createTable("sponsors", "Sponsors", [
  { key: "name", type: "varchar", size: 255, required: true },
  { key: "logo", type: "varchar", size: 500, required: true },
  { key: "website", type: "varchar", size: 500, required: true },
  { key: "tier", type: "enum", elements: ["platinum", "gold", "silver", "bronze", "partner"], required: true },
  { key: "description", type: "text", required: false },
  { key: "category", type: "varchar", size: 100, required: false },
  { key: "isActive", type: "boolean", required: true },
  { key: "displayOrder", type: "integer", required: true },
  { key: "featured", type: "boolean", required: true },
  { key: "startDate", type: "varchar", size: 30, required: true },
  { key: "endDate", type: "varchar", size: 30, required: false },
], [
  { key: "idx_active", type: "key", columns: ["isActive"] },
  { key: "idx_order", type: "key", columns: ["displayOrder"] },
  { key: "idx_featured", type: "key", columns: ["featured"] },
  { key: "idx_tier", type: "key", columns: ["tier"] },
]);

// ============================================================
// STORAGE BUCKETS
// ============================================================
console.log("\n\x1b[36m>>> Creating storage buckets\x1b[0m");

const MB = 1024 * 1024;

createBucket("event-images", "Event Images", 10 * MB, ["jpg", "jpeg", "png", "gif", "webp"]);
createBucket("sponsor-logos", "Sponsor Logos", 5 * MB, ["jpg", "jpeg", "png", "svg", "webp"]);
createBucket("blog-images", "Blog Images", 10 * MB, ["jpg", "jpeg", "png", "gif", "webp"]);
createBucket("profile-pictures", "Profile Pictures", 5 * MB, ["jpg", "jpeg", "png", "gif", "webp"]);
createBucket("gallery-images", "Gallery Images", 10 * MB, ["jpg", "jpeg", "png", "gif", "webp"]);
createBucket("resources", "Resources", 50 * MB, ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "txt", "csv", "mp4", "mp3"]);
createBucket("general", "General Storage", 50 * MB, ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx"]);

// ============================================================
// SUMMARY
// ============================================================
console.log("\n\x1b[35m============================================\x1b[0m");
console.log("\x1b[35m  Setup Complete!\x1b[0m");
console.log("\x1b[35m============================================\x1b[0m");
console.log(`  \x1b[32mSuccess : ${success}\x1b[0m`);
console.log(`  \x1b[33mFailed  : ${failed}\x1b[0m`);
console.log("");
console.log("Next steps:");
console.log(`  1. Add to .env.local: NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}`);
console.log("  2. Update permissions in Appwrite Console as needed");
console.log("  3. Seed initial data (event types, powers, departments)");
