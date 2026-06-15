#!/usr/bin/env node
// ============================================================
// MindMesh Appwrite Setup Script (Node.js SDK)
// Creates: 1 database, 22 collections, indexes, 7 storage buckets
// Run: node scripts/setup-appwrite.js
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

// Init SDK
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new TablesDB(client);
const storage = new Storage(client);

let ok = 0;
let fail = 0;

async function createTable(id, name, columns, indexes = []) {
  process.stdout.write(`  Creating table: ${name}...`);
  try {
    await db.createTable({
      databaseId: DB_ID,
      tableId: id,
      name,
      permissions: [
        Permission.read(Role.any()),
        Permission.write(Role.users()),
      ],
      columns: columns.map((c) => {
        const col = { key: c.key, type: c.type, required: c.required ?? false };
        if (c.size !== undefined) col.size = c.size;
        if (c.elements) col.elements = c.elements;
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
    if (e.code === 409) {
      console.log(" \x1b[33mEXISTS\x1b[0m");
      ok++;
    } else {
      console.log(` \x1b[31mFAIL: ${e.message}\x1b[0m`);
      fail++;
    }
  }
}

async function createBucket(id, name, maxSize, extensions) {
  process.stdout.write(`  Creating bucket: ${name}...`);
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
    if (e.code === 409) {
      console.log(" \x1b[33mEXISTS\x1b[0m");
      ok++;
    } else {
      console.log(` \x1b[31mFAIL: ${e.message}\x1b[0m`);
      fail++;
    }
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
  console.log("\n\x1b[36m  Tables:\x1b[0m");

  await createTable("events", "Events", [
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "slug", type: "varchar", size: 255, required: true },
    { key: "description", type: "text", required: true },
    { key: "image", type: "varchar", size: 500 },
    { key: "eventTypeId", type: "varchar", size: 36, required: true },
    { key: "status", type: "enum", elements: ["draft","review","approved","published","active","completed","cancelled"], required: true },
    { key: "audience", type: "enum", elements: ["public","member_only","exclusive"], required: true },
    { key: "date", type: "varchar", size: 30, required: true },
    { key: "time", type: "varchar", size: 30, required: true },
    { key: "endDate", type: "varchar", size: 30 },
    { key: "venue", type: "varchar", size: 255, required: true },
    { key: "location", type: "varchar", size: 500, required: true },
    { key: "capacity", type: "integer", required: true },
    { key: "registered", type: "integer", required: true },
    { key: "price", type: "float", required: true },
    { key: "discountPrice", type: "float" },
    { key: "organizerName", type: "varchar", size: 255, required: true },
    { key: "organizerAvatar", type: "varchar", size: 500 },
    { key: "ownerId", type: "varchar", size: 36, required: true },
    { key: "approvedBy", type: "varchar", size: 36 },
    { key: "approvedAt", type: "varchar", size: 30 },
    { key: "publishedAt", type: "varchar", size: 30 },
    { key: "tags", type: "varchar", size: 255, array: true },
    { key: "isFeatured", type: "boolean", required: true },
    { key: "isPremium", type: "boolean", required: true },
    { key: "eventDocs", type: "text" },
    { key: "externalLinks", type: "text" },
    { key: "materials", type: "text" },
    { key: "registrationUrl", type: "varchar", size: 500 },
    { key: "eventWebsite", type: "varchar", size: 500 },
    { key: "contactEmail", type: "email" },
  ], [
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_date", type: "key", columns: ["date"] },
    { key: "idx_owner", type: "key", columns: ["ownerId"] },
    { key: "idx_featured", type: "key", columns: ["isFeatured"] },
  ]);

  await createTable("registrations", "Registrations", [
    { key: "eventId", type: "varchar", size: 36, required: true },
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "status", type: "enum", elements: ["pending","approved","rejected","cancelled","waitlisted"], required: true },
    { key: "registeredAt", type: "varchar", size: 30, required: true },
    { key: "approvedBy", type: "varchar", size: 36 },
    { key: "approvedAt", type: "varchar", size: 30 },
    { key: "rejectionReason", type: "text" },
    { key: "metadata", type: "text" },
  ], [
    { key: "idx_event", type: "key", columns: ["eventId"] },
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_registered", type: "key", columns: ["registeredAt"] },
  ]);

  await createTable("projects", "Projects", [
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "description", type: "text", required: true },
    { key: "image", type: "varchar", size: 500, required: true },
    { key: "category", type: "varchar", size: 100, required: true },
    { key: "status", type: "varchar", size: 50, required: true },
    { key: "progress", type: "integer", required: true },
    { key: "technologies", type: "varchar", size: 100, array: true },
    { key: "stars", type: "integer", required: true },
    { key: "forks", type: "integer", required: true },
    { key: "contributors", type: "integer", required: true },
    { key: "duration", type: "varchar", size: 100, required: true },
    { key: "isFeatured", type: "boolean", required: true },
    { key: "demoUrl", type: "varchar", size: 500, required: true },
    { key: "repoUrl", type: "varchar", size: 500, required: true },
    { key: "teamMembers", type: "varchar", size: 255, array: true },
    { key: "createdAt", type: "varchar", size: 30, required: true },
  ], [
    { key: "idx_category", type: "key", columns: ["category"] },
    { key: "idx_featured", type: "key", columns: ["isFeatured"] },
  ]);

  await createTable("profiles", "Profiles", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "avatar", type: "varchar", size: 500 },
    { key: "pronouns", type: "enum", elements: ["he/him","she/her","they/them","he/they","she/they","prefer_to_say"] },
    { key: "phone", type: "varchar", size: 20 },
    { key: "urn", type: "varchar", size: 50 },
    { key: "program", type: "varchar", size: 100 },
    { key: "branch", type: "varchar", size: 100 },
    { key: "year", type: "varchar", size: 20 },
    { key: "semester", type: "varchar", size: 20 },
    { key: "address", type: "text" },
    { key: "dateOfBirth", type: "varchar", size: 30 },
    { key: "gender", type: "enum", elements: ["male","female","other","prefer_not_to_say"] },
    { key: "githubUrl", type: "varchar", size: 500 },
    { key: "linkedinUrl", type: "varchar", size: 500 },
    { key: "portfolioUrl", type: "varchar", size: 500 },
    { key: "bio", type: "text" },
    { key: "skills", type: "varchar", size: 100, array: true },
    { key: "interests", type: "varchar", size: 100, array: true },
    { key: "experience", type: "text" },
    { key: "whyJoin", type: "text" },
    { key: "availability", type: "enum", elements: ["full","partial","event_only"] },
    { key: "profileVisibility", type: "enum", elements: ["public","members_only","private"] },
    { key: "showOnAboutPage", type: "boolean" },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
  ]);

  await createTable("applications", "Applications", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "status", type: "enum", elements: ["pending","approved","rejected","reapplied"], required: true },
    { key: "profileId", type: "varchar", size: 36, required: true },
    { key: "oathAccepted", type: "boolean", required: true },
    { key: "termsAccepted", type: "boolean", required: true },
    { key: "constitutionAccepted", type: "boolean", required: true },
    { key: "preferredDepartments", type: "varchar", size: 100, array: true },
    { key: "reviewedBy", type: "varchar", size: 36 },
    { key: "reviewedAt", type: "varchar", size: 30 },
    { key: "rejectionReason", type: "text" },
    { key: "submittedAt", type: "varchar", size: 30, required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_submitted", type: "key", columns: ["submittedAt"] },
  ]);

  await createTable("memberships", "Memberships", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "applicationId", type: "varchar", size: 36, required: true },
    { key: "status", type: "enum", elements: ["active","inactive","suspended","banned"], required: true },
    { key: "membershipNumber", type: "varchar", size: 20, required: true },
    { key: "approvedBy", type: "varchar", size: 36, required: true },
    { key: "approvedAt", type: "varchar", size: 30, required: true },
    { key: "department", type: "varchar", size: 100 },
    { key: "joinedAt", type: "varchar", size: 30, required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_joined", type: "key", columns: ["joinedAt"] },
  ]);

  await createTable("departments", "Departments", [
    { key: "name", type: "varchar", size: 100, required: true },
    { key: "slug", type: "varchar", size: 100, required: true },
    { key: "description", type: "text" },
    { key: "icon", type: "varchar", size: 100 },
    { key: "color", type: "varchar", size: 20 },
    { key: "parentId", type: "varchar", size: 36 },
    { key: "headId", type: "varchar", size: 36 },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
    { key: "category", type: "enum", elements: ["technical","content","operations"], required: true },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
  ]);

  await createTable("user_departments", "User Departments", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "departmentId", type: "varchar", size: 36, required: true },
    { key: "role", type: "enum", elements: ["member","core_member","lead"], required: true },
    { key: "assignedBy", type: "varchar", size: 36, required: true },
    { key: "assignedAt", type: "varchar", size: 30, required: true },
    { key: "isActive", type: "boolean", required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_dept", type: "key", columns: ["departmentId"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
  ]);

  await createTable("designations", "Designations", [
    { key: "name", type: "varchar", size: 100, required: true },
    { key: "slug", type: "varchar", size: 100, required: true },
    { key: "description", type: "text" },
    { key: "level", type: "integer", required: true },
    { key: "category", type: "enum", elements: ["department","operations","executive","special"], required: true },
    { key: "departmentId", type: "varchar", size: 36 },
    { key: "badgeIcon", type: "varchar", size: 100 },
    { key: "badgeColor", type: "varchar", size: 20 },
    { key: "isActive", type: "boolean", required: true },
    { key: "maxHolders", type: "integer" },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_level", type: "key", columns: ["level"] },
  ]);

  await createTable("user_designations", "User Designations", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "designationId", type: "varchar", size: 36, required: true },
    { key: "assignedBy", type: "varchar", size: 36, required: true },
    { key: "assignedAt", type: "varchar", size: 30, required: true },
    { key: "revokedAt", type: "varchar", size: 30 },
    { key: "revokedBy", type: "varchar", size: 36 },
    { key: "isActive", type: "boolean", required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
  ]);

  await createTable("powers", "Powers", [
    { key: "name", type: "varchar", size: 100, required: true },
    { key: "displayName", type: "varchar", size: 100, required: true },
    { key: "description", type: "text" },
    { key: "category", type: "enum", elements: ["membership","events","tickets","content","resources","admin","gallery","social"], required: true },
    { key: "scope", type: "enum", elements: ["global","department","own"], required: true },
  ], [
    { key: "idx_name", type: "key", columns: ["name"] },
  ]);

  await createTable("user_powers", "User Powers", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "powerId", type: "varchar", size: 36, required: true },
    { key: "grantedBy", type: "varchar", size: 36, required: true },
    { key: "grantedAt", type: "varchar", size: 30, required: true },
    { key: "departmentId", type: "varchar", size: 36 },
    { key: "expiresAt", type: "varchar", size: 30 },
    { key: "isActive", type: "boolean", required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
  ]);

  await createTable("tickets", "Tickets", [
    { key: "eventId", type: "varchar", size: 36, required: true },
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "registrationId", type: "varchar", size: 36, required: true },
    { key: "ticketCode", type: "varchar", size: 20, required: true },
    { key: "qrData", type: "text", required: true },
    { key: "status", type: "enum", elements: ["pending","issued","active","checked_in","completed","invalidated","transferred","waitlisted"], required: true },
    { key: "issuedAt", type: "varchar", size: 30 },
    { key: "checkedInAt", type: "varchar", size: 30 },
    { key: "checkedInBy", type: "varchar", size: 36 },
    { key: "invalidatedAt", type: "varchar", size: 30 },
    { key: "invalidatedReason", type: "text" },
    { key: "transferredTo", type: "varchar", size: 36 },
    { key: "transferHistory", type: "text" },
    { key: "entryCount", type: "integer", required: true },
    { key: "maxEntries", type: "integer", required: true },
    { key: "metadata", type: "text" },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_event", type: "key", columns: ["eventId"] },
    { key: "idx_issued", type: "key", columns: ["issuedAt"] },
  ]);

  await createTable("ticket_verifications", "Ticket Verifications", [
    { key: "ticketId", type: "varchar", size: 36, required: true },
    { key: "eventId", type: "varchar", size: 36, required: true },
    { key: "verifiedBy", type: "varchar", size: 36, required: true },
    { key: "method", type: "enum", elements: ["qr_scan","manual_search","manual_entry"], required: true },
    { key: "result", type: "enum", elements: ["success","already_checked_in","invalid_ticket","event_not_active"], required: true },
    { key: "verifiedAt", type: "varchar", size: 30, required: true },
    { key: "metadata", type: "text" },
  ]);

  await createTable("resources", "Resources", [
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "description", type: "text" },
    { key: "type", type: "enum", elements: ["document","link","video","file","announcement"], required: true },
    { key: "url", type: "varchar", size: 500 },
    { key: "fileId", type: "varchar", size: 36 },
    { key: "layer", type: "enum", elements: ["common","department","role"], required: true },
    { key: "departmentId", type: "varchar", size: 36 },
    { key: "designationId", type: "varchar", size: 36 },
    { key: "tags", type: "varchar", size: 100, array: true },
    { key: "uploadedBy", type: "varchar", size: 36, required: true },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
    { key: "category", type: "enum", elements: ["common","department","role"], required: true },
    { key: "requiredRole", type: "varchar", size: 100 },
    { key: "uploadedByName", type: "varchar", size: 255, required: true },
    { key: "downloads", type: "integer", required: true },
  ], [
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_category", type: "key", columns: ["category"] },
    { key: "idx_dept", type: "key", columns: ["departmentId"] },
    { key: "idx_role", type: "key", columns: ["requiredRole"] },
  ]);

  await createTable("notifications", "Notifications", [
    { key: "userId", type: "varchar", size: 36, required: true },
    { key: "type", type: "varchar", size: 100, required: true },
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "body", type: "text", required: true },
    { key: "letter", type: "text" },
    { key: "data", type: "text" },
    { key: "read", type: "boolean", required: true },
    { key: "readAt", type: "varchar", size: 30 },
    { key: "createdAt", type: "varchar", size: 30, required: true },
  ], [
    { key: "idx_user", type: "key", columns: ["userId"] },
    { key: "idx_read", type: "key", columns: ["read"] },
    { key: "idx_created", type: "key", columns: ["createdAt"] },
  ]);

  await createTable("audit_logs", "Audit Logs", [
    { key: "actorId", type: "varchar", size: 36, required: true },
    { key: "actorName", type: "varchar", size: 255, required: true },
    { key: "actorRole", type: "varchar", size: 50, required: true },
    { key: "action", type: "varchar", size: 100, required: true },
    { key: "entityType", type: "varchar", size: 50, required: true },
    { key: "entityId", type: "varchar", size: 36, required: true },
    { key: "details", type: "text" },
    { key: "ipAddress", type: "varchar", size: 45 },
    { key: "userAgent", type: "text" },
    { key: "timestamp", type: "varchar", size: 30, required: true },
  ], [
    { key: "idx_actor", type: "key", columns: ["actorId"] },
    { key: "idx_entity", type: "key", columns: ["entityType","entityId"] },
    { key: "idx_action", type: "key", columns: ["action"] },
    { key: "idx_timestamp", type: "key", columns: ["timestamp"] },
  ]);

  await createTable("gallery", "Gallery", [
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "description", type: "text" },
    { key: "imageUrl", type: "varchar", size: 500, required: true },
    { key: "thumbnailUrl", type: "varchar", size: 500 },
    { key: "category", type: "enum", elements: ["events","workshops","hackathons","team","projects","other"], required: true },
    { key: "uploadedBy", type: "varchar", size: 36, required: true },
    { key: "eventId", type: "varchar", size: 36 },
    { key: "departmentId", type: "varchar", size: 36 },
    { key: "status", type: "enum", elements: ["pending","approved","rejected"], required: true },
    { key: "approvedBy", type: "varchar", size: 36 },
    { key: "approvedAt", type: "varchar", size: 30 },
    { key: "rejectionReason", type: "text" },
    { key: "tags", type: "varchar", size: 100, array: true },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
  ], [
    { key: "idx_status", type: "key", columns: ["status"] },
    { key: "idx_category", type: "key", columns: ["category"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
  ]);

  await createTable("approval_workflows", "Approval Workflows", [
    { key: "entityType", type: "enum", elements: ["membership","event","registration","promotion","department_assignment"], required: true },
    { key: "entityId", type: "varchar", size: 36, required: true },
    { key: "currentStep", type: "integer", required: true },
    { key: "totalSteps", type: "integer", required: true },
    { key: "steps", type: "text", required: true },
    { key: "status", type: "enum", elements: ["pending","in_progress","approved","rejected"], required: true },
    { key: "initiatedBy", type: "varchar", size: 36, required: true },
    { key: "initiatedAt", type: "varchar", size: 30, required: true },
    { key: "completedAt", type: "varchar", size: 30 },
  ]);

  await createTable("event_types", "Event Types", [
    { key: "name", type: "varchar", size: 100, required: true },
    { key: "displayName", type: "varchar", size: 100, required: true },
    { key: "description", type: "text" },
    { key: "icon", type: "varchar", size: 100 },
    { key: "fields", type: "text", required: true },
    { key: "registrationConfig", type: "text", required: true },
    { key: "ticketConfig", type: "text", required: true },
    { key: "workflowConfig", type: "text", required: true },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer" },
  ], [
    { key: "idx_name", type: "key", columns: ["name"] },
    { key: "idx_active", type: "key", columns: ["isActive"] },
    { key: "idx_order", type: "key", columns: ["displayOrder"] },
  ]);

  await createTable("event_type_data", "Event Type Data", [
    { key: "eventId", type: "varchar", size: 36, required: true },
    { key: "eventTypeId", type: "varchar", size: 36, required: true },
    { key: "fieldData", type: "text", required: true },
  ], [
    { key: "idx_event", type: "key", columns: ["eventId"] },
  ]);

  await createTable("blogs", "Blogs", [
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "slug", type: "varchar", size: 255, required: true },
    { key: "excerpt", type: "varchar", size: 500, required: true },
    { key: "content", type: "text", required: true },
    { key: "coverImage", type: "varchar", size: 500, required: true },
    { key: "category", type: "varchar", size: 100, required: true },
    { key: "tags", type: "varchar", size: 100, array: true },
    { key: "authorId", type: "varchar", size: 36, required: true },
    { key: "authorName", type: "varchar", size: 255, required: true },
    { key: "authorEmail", type: "email", required: true },
    { key: "authorAvatar", type: "varchar", size: 500 },
    { key: "status", type: "enum", elements: ["draft","pending","approved","rejected"], required: true },
    { key: "rejectionReason", type: "text" },
    { key: "publishedAt", type: "varchar", size: 30 },
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
    { key: "name", type: "varchar", size: 255, required: true },
    { key: "logo", type: "varchar", size: 500, required: true },
    { key: "website", type: "varchar", size: 500, required: true },
    { key: "tier", type: "enum", elements: ["platinum","gold","silver","bronze","partner"], required: true },
    { key: "description", type: "text" },
    { key: "category", type: "varchar", size: 100 },
    { key: "isActive", type: "boolean", required: true },
    { key: "displayOrder", type: "integer", required: true },
    { key: "featured", type: "boolean", required: true },
    { key: "startDate", type: "varchar", size: 30, required: true },
    { key: "endDate", type: "varchar", size: 30 },
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
  console.log(`  1. NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID} is already in .env.local`);
  console.log("  2. Update permissions in Appwrite Console as needed");
  console.log("  3. Seed initial data (event types, powers, departments)");
})();
