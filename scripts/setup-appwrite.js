#!/usr/bin/env node
// ============================================================
// MindMesh Appwrite Setup Script (Node.js SDK)
// Creates: 1 database, 22 tables, indexes, 7 storage buckets
// Run: node scripts/setup-appwrite.js
//
// SDK-supported column types: string, boolean, integer, datetime
// Other types (enum, float, email, url, ip) stored as string
// ============================================================

const fs = require("fs");
const path = require("path");
const { Client, TablesDB, Storage, ID, Permission, Role } = require("node-appwrite");

// Read config from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const get = (key) => {
  const m = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\s]+)"?`));
  return m ? m[1].trim() : null;
};

const ENDPOINT = get("NEXT_PUBLIC_APPWRITE_ENDPOINT");
const PROJECT_ID = get("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
const API_KEY = get("NEXT_PUBLIC_APPWRITE_API_KEY");
const DB_ID = "mindmesh_db";

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error("Missing ENDPOINT, PROJECT_ID, or API_KEY in .env.local");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new TablesDB(client);
const storage = new Storage(client);

let ok = 0;
let fail = 0;

// Helper: create table with SDK-supported types
// string -> varchar-like (inline, indexable up to size)
// integer -> integer
// boolean -> boolean
// datetime -> datetime (ISO 8601)
async function createTable(id, name, columns, indexes = []) {
  process.stdout.write(`  ${name}...`);
  try {
    await db.createTable({
      databaseId: DB_ID,
      tableId: id,
      name,
      permissions: [
        Permission.read(Role.any()),
        Permission.write(Role.users()),
      ],
      rowSecurity: false,
      enabled: true,
      columns: columns.map((c) => {
        const col = { key: c.key, type: c.type, required: c.required ?? false };
        if (c.size !== undefined) col.size = c.size;
        if (c.array) col.array = true;
        return col;
      }),
      indexes: indexes.map((i) => ({
        key: i.key,
        type: i.type,
        attributes: i.columns,
        orders: i.orders || i.columns.map(() => "ASC"),
      })),
    });
    console.log(" \x1b[32mOK\x1b[0m");
    ok++;
  } catch (e) {
    if (e.code === 409) { console.log(" \x1b[33mEXISTS\x1b[0m"); ok++; }
    else { console.log(` \x1b[31mFAIL: ${e.message}\x1b[0m`); fail++; }
  }
}

async function createBucket(id, name, maxSize, extensions) {
  process.stdout.write(`  ${name}...`);
  try {
    await storage.createBucket({
      bucketId: id,
      name,
      permissions: [
        Permission.read(Role.any()),
        Permission.write(Role.users()),
      ],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: maxSize,
      allowedFileExtensions: extensions,
      compression: "gzip",
      encryption: true,
      antivirus: true,
    });
    console.log(" \x1b[32mOK\x1b[0m");
    ok++;
  } catch (e) {
    if (e.code === 409) { console.log(" \x1b[33mEXISTS\x1b[0m"); ok++; }
    else { console.log(` \x1b[31mFAIL: ${e.message}\x1b[0m`); fail++; }
  }
}

// ============================================================
// MAIN
// ============================================================
(async () => {
  console.log("\n\x1b[35m============================================\x1b[0m");
  console.log("\x1b[35m  MindMesh Appwrite Database Setup\x1b[0m");
  console.log("\x1b[35m============================================\x1b[0m");
  console.log(`  Endpoint : ${ENDPOINT}`);
  console.log(`  Project  : ${PROJECT_ID}`);
  console.log(`  Database : ${DB_ID}\n`);

  // Create database
  process.stdout.write("  Creating database...");
  try {
    await db.create({ databaseId: DB_ID, name: "MindMesh Club" });
    console.log(" \x1b[32mOK\x1b[0m");
    ok++;
  } catch (e) {
    if (e.code === 409) { console.log(" \x1b[33mEXISTS\x1b[0m"); ok++; }
    else { console.log(` \x1b[31mFAIL: ${e.message}\x1b[0m`); fail++; }
  }

  const MB = 1024 * 1024;

  // ===== TABLES =====
  // Column types: string (size required), boolean, integer, datetime
  // For enum/float/email/url fields -> use string
  console.log("\n\x1b[36m  Tables:\x1b[0m");

  await createTable("events", "Events", [
    { key: "title", type: "string", size: 255, required: true },
    { key: "slug", type: "string", size: 255, required: true },
    { key: "description", type: "string", size: 65535, required: true },
    { key: "image", type: "string", size: 500 },
    { key: "eventTypeId", type: "string", size: 36, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "audience", type: "string", size: 50, required: true },
    { key: "date", type: "string", size: 30, required: true },
    { key: "time", type: "string", size: 30, required: true },
    { key: "endDate", type: "string", size: 30 },
    { key: "venue", type: "string", size: 255, required: true },
    { key: "location", type: "string", size: 500, required: true },
    { key: "capacity", type: "integer", required: true },
    { key: "registered", type: "integer", required: true },
    { key: "price", type: "integer", required: true },
    { key: "discountPrice", type: "integer" },
    { key: "organizerName", type: "string", size: 255, required: true },
    { key: "organizerAvatar", type: "string", size: 500 },
    { key: "ownerId", type: "string", size: 36, required: true },
    { key: "approvedBy", type: "string", size: 36 },
    { key: "approvedAt", type: "string", size: 30 },
    { key: "publishedAt", type: "string", size: 30 },
    { key: "tags", type: "string", size: 255, array: true },
    { key: "isFeatured", type: "boolean", required: true },
    { key: "isPremium", type: "boolean", required: true },
    { key: "eventDocs", type: "string", size: 65535 },
    { key: "externalLinks", type: "string", size: 65535 },
    { key: "materials", type: "string", size: 65535 },
    { key: "registrationUrl", type: "string", size: 500 },
    { key: "eventWebsite", type: "string", size: 500 },
    { key: "contactEmail", type: "string", size: 255 },
  ], [
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_date", type: "key", columns: ["date"] },
    { key: "idx_owner", type: "key", columns: ["ownerId"] },
    { key: "idx_featured", type: "key", columns: ["isFeatured"] },
  ]);

  await createTable("registrations", "Registrations", [
    { key: "eventId", type: "string", size: 36, required: true },
    { key: "userId", type: "string", size: 36, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "registeredAt", type: "string", size: 30, required: true },
    { key: "approvedBy", type: "string", size: 36 },
    { key: "approvedAt", type: "string", size: 30 },
    { key: "rejectionReason", type: "string", size: 65535 },
    { key: "metadata", type: "string", size: 65535 },
  ], [
    { key: "idx_event", type: "key", columns: ["eventId"] },
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_registered", type: "key", columns: ["registeredAt"] },
  ]);

  await createTable("projects", "Projects", [
    { key: "title", type: "string", size: 255, required: true },
    { key: "description", type: "string", size: 65535, required: true },
    { key: "image", type: "string", size: 500, required: true },
    { key: "category", type: "string", size: 100, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "progress", type: "integer", required: true },
    { key: "technologies", type: "string", size: 100, array: true },
    { key: "stars", type: "integer", required: true },
    { key: "forks", type: "integer", required: true },
    { key: "contributors", type: "integer", required: true },
    { key: "duration", type: "string", size: 100, required: true },
    { key: "isFeatured", type: "boolean", required: true },
    { key: "demoUrl", type: "string", size: 500, required: true },
    { key: "repoUrl", type: "string", size: 500, required: true },
    { key: "teamMembers", type: "string", size: 255, array: true },
    { key: "createdAt", type: "string", size: 30, required: true },
  ], [
    { key: "idx_category", type: "key", columns: ["category"] },
    { key: "idx_featured", type: "key", columns: ["isFeatured"] },
  ]);

  await createTable("profiles", "Profiles", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "avatar", type: "string", size: 500 },
    { key: "pronouns", type: "string", size: 30 },
    { key: "phone", type: "string", size: 20 },
    { key: "urn", type: "string", size: 50 },
    { key: "program", type: "string", size: 100 },
    { key: "branch", type: "string", size: 100 },
    { key: "year", type: "string", size: 20 },
    { key: "semester", type: "string", size: 20 },
    { key: "address", type: "string", size: 65535 },
    { key: "dateOfBirth", type: "string", size: 30 },
    { key: "gender", type: "string", size: 30 },
    { key: "githubUrl", type: "string", size: 500 },
    { key: "linkedinUrl", type: "string", size: 500 },
    { key: "portfolioUrl", type: "string", size: 500 },
    { key: "bio", type: "string", size: 65535 },
    { key: "skills", type: "string", size: 100, array: true },
    { key: "interests", type: "string", size: 100, array: true },
    { key: "experience", type: "string", size: 65535 },
    { key: "whyJoin", type: "string", size: 65535 },
    { key: "availability", type: "string", size: 30 },
    { key: "profileVisibility", type: "string", size: 30 },
    { key: "showOnAboutPage", type: "boolean" },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
  ]);

  await createTable("applications", "Applications", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "profileId", type: "string", size: 36, required: true },
    { key: "oathAccepted", type: "boolean", required: true },
    { key: "termsAccepted", type: "boolean", required: true },
    { key: "constitutionAccepted", type: "boolean", required: true },
    { key: "preferredDepartments", type: "string", size: 100, array: true },
    { key: "reviewedBy", type: "string", size: 36 },
    { key: "reviewedAt", type: "string", size: 30 },
    { key: "rejectionReason", type: "string", size: 65535 },
    { key: "submittedAt", type: "string", size: 30, required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_submitted", type: "key", columns: ["submittedAt"] },
  ]);

  await createTable("memberships", "Memberships", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "applicationId", type: "string", size: 36, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "membershipNumber", type: "string", size: 20, required: true },
    { key: "approvedBy", type: "string", size: 36, required: true },
    { key: "approvedAt", type: "string", size: 30, required: true },
    { key: "department", type: "string", size: 100 },
    { key: "joinedAt", type: "string", size: 30, required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_joined", type: "key", columns: ["joinedAt"] },
  ]);

  await createTable("departments", "Departments", [
    { key: "name", type: "string", size: 100, required: true },
    { key: "slug", type: "string", size: 100, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "icon", type: "string", size: 100 },
    { key: "color", type: "string", size: 20 },
    { key: "parentId", type: "string", size: 36 },
    { key: "headId", type: "string", size: 36 },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
    { key: "category", type: "string", size: 50, required: true },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
  ]);

  await createTable("user_departments", "User Departments", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "departmentId", type: "string", size: 36, required: true },
    { key: "role", type: "string", size: 50, required: true },
    { key: "assignedBy", type: "string", size: 36, required: true },
    { key: "assignedAt", type: "string", size: 30, required: true },
    { key: "isActive", type: "boolean", required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_dept", type: "key", columns: ["departmentId"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
  ]);

  await createTable("designations", "Designations", [
    { key: "name", type: "string", size: 100, required: true },
    { key: "slug", type: "string", size: 100, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "level", type: "integer", required: true },
    { key: "category", type: "string", size: 50, required: true },
    { key: "departmentId", type: "string", size: 36 },
    { key: "badgeIcon", type: "string", size: 100 },
    { key: "badgeColor", type: "string", size: 20 },
    { key: "isActive", type: "boolean", required: true },
    { key: "maxHolders", type: "integer" },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_level", type: "key", columns: ["level"] },
  ]);

  await createTable("user_designations", "User Designations", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "designationId", type: "string", size: 36, required: true },
    { key: "assignedBy", type: "string", size: 36, required: true },
    { key: "assignedAt", type: "string", size: 30, required: true },
    { key: "revokedAt", type: "string", size: 30 },
    { key: "revokedBy", type: "string", size: 36 },
    { key: "isActive", type: "boolean", required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
  ]);

  await createTable("powers", "Powers", [
    { key: "name", type: "string", size: 100, required: true },
    { key: "displayName", type: "string", size: 100, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "category", type: "string", size: 50, required: true },
    { key: "scope", type: "string", size: 50, required: true },
  ], [
    { key: "idx_name", type: "key", columns: ["name"] },
  ]);

  await createTable("user_powers", "User Powers", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "powerId", type: "string", size: 36, required: true },
    { key: "grantedBy", type: "string", size: 36, required: true },
    { key: "grantedAt", type: "string", size: 30, required: true },
    { key: "departmentId", type: "string", size: 36 },
    { key: "expiresAt", type: "string", size: 30 },
    { key: "isActive", type: "boolean", required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
  ]);

  await createTable("tickets", "Tickets", [
    { key: "eventId", type: "string", size: 36, required: true },
    { key: "userId", type: "string", size: 36, required: true },
    { key: "registrationId", type: "string", size: 36, required: true },
    { key: "ticketCode", type: "string", size: 20, required: true },
    { key: "qrData", type: "string", size: 65535, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "issuedAt", type: "string", size: 30 },
    { key: "checkedInAt", type: "string", size: 30 },
    { key: "checkedInBy", type: "string", size: 36 },
    { key: "invalidatedAt", type: "string", size: 30 },
    { key: "invalidatedReason", type: "string", size: 65535 },
    { key: "transferredTo", type: "string", size: 36 },
    { key: "transferHistory", type: "string", size: 65535 },
    { key: "entryCount", type: "integer", required: true },
    { key: "maxEntries", type: "integer", required: true },
    { key: "metadata", type: "string", size: 65535 },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_event", type: "key", columns: ["eventId"] },
    { key: "idx_issued", type: "key", columns: ["issuedAt"] },
  ]);

  await createTable("ticket_verifications", "Ticket Verifications", [
    { key: "ticketId", type: "string", size: 36, required: true },
    { key: "eventId", type: "string", size: 36, required: true },
    { key: "verifiedBy", type: "string", size: 36, required: true },
    { key: "method", type: "string", size: 50, required: true },
    { key: "result", type: "string", size: 50, required: true },
    { key: "verifiedAt", type: "string", size: 30, required: true },
    { key: "metadata", type: "string", size: 65535 },
  ]);

  await createTable("resources", "Resources", [
    { key: "title", type: "string", size: 255, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "type", type: "string", size: 50, required: true },
    { key: "url", type: "string", size: 500 },
    { key: "fileId", type: "string", size: 36 },
    { key: "layer", type: "string", size: 50, required: true },
    { key: "departmentId", type: "string", size: 36 },
    { key: "designationId", type: "string", size: 36 },
    { key: "tags", type: "string", size: 100, array: true },
    { key: "uploadedBy", type: "string", size: 36, required: true },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
    { key: "category", type: "string", size: 50, required: true },
    { key: "requiredRole", type: "string", size: 100 },
    { key: "uploadedByName", type: "string", size: 255, required: true },
    { key: "downloads", type: "integer", required: true },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_category", type: "key", columns: ["category"] },
    { key: "idx_dept", type: "key", columns: ["departmentId"] },
    { key: "idx_role", type: "key", columns: ["requiredRole"] },
  ]);

  await createTable("notifications", "Notifications", [
    { key: "userId", type: "string", size: 36, required: true },
    { key: "type", type: "string", size: 100, required: true },
    { key: "title", type: "string", size: 255, required: true },
    { key: "body", type: "string", size: 65535, required: true },
    { key: "letter", type: "string", size: 65535 },
    { key: "data", type: "string", size: 65535 },
    { key: "read", type: "boolean", required: true },
    { key: "readAt", type: "string", size: 30 },
    { key: "createdAt", type: "string", size: 30, required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_read", type: "key", columns: ["read"] },
    { key: "idx_created", type: "key", columns: ["createdAt"] },
  ]);

  await createTable("audit_logs", "Audit Logs", [
    { key: "actorId", type: "string", size: 36, required: true },
    { key: "actorName", type: "string", size: 255, required: true },
    { key: "actorRole", type: "string", size: 50, required: true },
    { key: "action", type: "string", size: 100, required: true },
    { key: "entityType", type: "string", size: 50, required: true },
    { key: "entityId", type: "string", size: 36, required: true },
    { key: "details", type: "string", size: 65535 },
    { key: "ipAddress", type: "string", size: 45 },
    { key: "userAgent", type: "string", size: 65535 },
    { key: "timestamp", type: "string", size: 30, required: true },
  ], [
    { key: "idx_actor", type: "key", columns: ["actorId"] },
    { key: "idx_entity", type: "key", columns: ["entityType", "entityId"] },
    { key: "idx_action", type: "key", columns: ["action"] },
    { key: "idx_timestamp", type: "key", columns: ["timestamp"] },
  ]);

  await createTable("gallery", "Gallery", [
    { key: "title", type: "string", size: 255, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "imageUrl", type: "string", size: 500, required: true },
    { key: "thumbnailUrl", type: "string", size: 500 },
    { key: "category", type: "string", size: 50, required: true },
    { key: "uploadedBy", type: "string", size: 36, required: true },
    { key: "eventId", type: "string", size: 36 },
    { key: "departmentId", type: "string", size: 36 },
    { key: "status", type: "string", size: 50, required: true },
    { key: "approvedBy", type: "string", size: 36 },
    { key: "approvedAt", type: "string", size: 30 },
    { key: "rejectionReason", type: "string", size: 65535 },
    { key: "tags", type: "string", size: 100, array: true },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
  ], [
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_category", type: "key", columns: ["category"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
  ]);

  await createTable("approval_workflows", "Approval Workflows", [
    { key: "entityType", type: "string", size: 50, required: true },
    { key: "entityId", type: "string", size: 36, required: true },
    { key: "currentStep", type: "integer", required: true },
    { key: "totalSteps", type: "integer", required: true },
    { key: "steps", type: "string", size: 65535, required: true },
    { key: "status", type: "string", size: 50, required: true },
    { key: "initiatedBy", type: "string", size: 36, required: true },
    { key: "initiatedAt", type: "string", size: 30, required: true },
    { key: "completedAt", type: "string", size: 30 },
  ]);

  await createTable("event_types", "Event Types", [
    { key: "name", type: "string", size: 100, required: true },
    { key: "displayName", type: "string", size: 100, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "icon", type: "string", size: 100 },
    { key: "fields", type: "string", size: 65535, required: true },
    { key: "registrationConfig", type: "string", size: 65535, required: true },
    { key: "ticketConfig", type: "string", size: 65535, required: true },
    { key: "workflowConfig", type: "string", size: 65535, required: true },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
  ], [
    { key: "idx_name", type: "key", columns: ["name"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
  ]);

  await createTable("event_type_data", "Event Type Data", [
    { key: "eventId", type: "string", size: 36, required: true },
    { key: "eventTypeId", type: "string", size: 36, required: true },
    { key: "fieldData", type: "string", size: 65535, required: true },
  ], [
    { key: "idx_event", type: "key", columns: ["eventId"] },
  ]);

  await createTable("blogs", "Blogs", [
    { key: "title", type: "string", size: 255, required: true },
    { key: "slug", type: "string", size: 255, required: true },
    { key: "excerpt", type: "string", size: 500, required: true },
    { key: "content", type: "string", size: 65535, required: true },
    { key: "coverImage", type: "string", size: 500, required: true },
    { key: "category", type: "string", size: 100, required: true },
    { key: "tags", type: "string", size: 100, array: true },
    { key: "authorId", type: "string", size: 36, required: true },
    { key: "authorName", type: "string", size: 255, required: true },
    { key: "authorEmail", type: "string", size: 255, required: true },
    { key: "authorAvatar", type: "string", size: 500 },
    { key: "status", type: "string", size: 50, required: true },
    { key: "rejectionReason", type: "string", size: 65535 },
    { key: "publishedAt", type: "string", size: 30 },
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

  await createTable("sponsors", "Sponsors", [
    { key: "name", type: "string", size: 255, required: true },
    { key: "logo", type: "string", size: 500, required: true },
    { key: "website", type: "string", size: 500, required: true },
    { key: "tier", type: "string", size: 50, required: true },
    { key: "description", type: "string", size: 65535 },
    { key: "category", type: "string", size: 100 },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer", required: true },
    { key: "featured", type: "boolean", required: true },
    { key: "startDate", type: "string", size: 30, required: true },
    { key: "endDate", type: "string", size: 30 },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
    { key: "idx_featured", type: "key", columns: ["featured"] },
    { key: "idx_tier", type: "key", columns: ["tier"] },
  ]);

  // ===== BUCKETS =====
  console.log("\n\x1b[36m  Buckets:\x1b[0m");

  await createBucket("event-images", "Event Images", 10 * MB, ["jpg","jpeg","png","gif","webp"]);
  await createBucket("sponsor-logos", "Sponsor Logos", 5 * MB, ["jpg","jpeg","png","svg","webp"]);
  await createBucket("blog-images", "Blog Images", 10 * MB, ["jpg","jpeg","png","gif","webp"]);
  await createBucket("profile-pictures", "Profile Pictures", 5 * MB, ["jpg","jpeg","png","gif","webp"]);
  await createBucket("gallery-images", "Gallery Images", 10 * MB, ["jpg","jpeg","png","gif","webp"]);
  await createBucket("resources", "Resources", 50 * MB, ["pdf","doc","docx","xls","xlsx","ppt","pptx","zip","rar","txt","csv","mp4","mp3"]);
  await createBucket("general", "General Storage", 50 * MB, ["jpg","jpeg","png","gif","webp","pdf","doc","docx"]);

  // ===== SUMMARY =====
  console.log("\n\x1b[35m============================================\x1b[0m");
  console.log("\x1b[35m  Setup Complete!\x1b[0m");
  console.log("\x1b[35m============================================\x1b[0m");
  console.log(`  \x1b[32mSuccess : ${ok}\x1b[0m`);
  console.log(`  \x1b[31mFailed  : ${fail}\x1b[0m`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID} is in .env.local`);
  console.log("  2. Update permissions in Appwrite Console as needed");
  console.log("  3. Seed initial data (event types, powers, departments)");
})();
