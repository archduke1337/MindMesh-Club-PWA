# ============================================================
# MindMesh Appwrite Setup Script
# Creates: 1 database, 22 collections, indexes, 7 storage buckets
# ============================================================
# Run: powershell -ExecutionPolicy Bypass -File scripts/setup-appwrite.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$SuccessCount = 0
$FailCount = 0
$SkipCount = 0

function Write-Step {
    param([string]$Message)
    Write-Host "`n>>> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
    $script:SuccessCount++
}

function Write-Skip {
    param([string]$Message)
    Write-Host "  [SKIP] $Message" -ForegroundColor Yellow
    $script:SkipCount++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
    $script:FailCount++
}

function Invoke-Appwrite {
    param([string[]]$Args)
    $output = & appwrite @Args 2>&1
    $exitCode = $LASTEXITCODE
    $text = $output | Out-String
    if ($exitCode -eq 0 -or $text -match "already exists") {
        return $true
    } else {
        Write-Host "    $text" -ForegroundColor DarkGray
        return $false
    }
}

# ============================================================
# CONFIGURATION
# ============================================================
$DB_ID = "mindmesh_db"
$ENDPOINT = "https://fra.cloud.appwrite.io/v1"
$PROJECT_ID = "6a0a45a700360d3f9f6b"

Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  MindMesh Appwrite Database Setup" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "Endpoint : $ENDPOINT"
Write-Host "Project  : $PROJECT_ID"
Write-Host "Database : $DB_ID"

# Set client
appwrite client --endpoint $ENDPOINT --project-id $PROJECT_ID 2>$null

# ============================================================
# 1. CREATE DATABASE
# ============================================================
Write-Step "Creating database: $DB_ID"
$ok = Invoke-Appwrite "tables-db", "create", "--database-id", $DB_ID, "--name", "MindMesh Club"
if ($ok) { Write-Ok "Database created" } else { Write-Fail "Database creation failed (may already exist)" }

# ============================================================
# HELPER: Create a table with columns and indexes
# ============================================================
function New-MindMeshTable {
    param(
        [string]$TableId,
        [string]$TableName,
        [array]$Columns,
        [array]$Indexes = @()
    )

    Write-Step "Creating table: $TableName ($TableId)"

    # Build columns JSON
    $colsJson = $Columns | ConvertTo-Json -Compress -Depth 5
    # Build indexes JSON if any
    if ($Indexes.Count -gt 0) {
        $idxJson = $Indexes | ConvertTo-Json -Compress -Depth 5
        $ok = Invoke-Appwrite "tables-db", "create-table", `
            "--database-id", $DB_ID, `
            "--table-id", $TableId, `
            "--name", $TableName, `
            "--row-security", "false", `
            "--enabled", "true", `
            "--columns", $colsJson, `
            "--indexes", $idxJson
    } else {
        $ok = Invoke-Appwrite "tables-db", "create-table", `
            "--database-id", $DB_ID, `
            "--table-id", $TableId, `
            "--name", $TableName, `
            "--row-security", "false", `
            "--enabled", "true", `
            "--columns", $colsJson
    }

    if ($ok) { Write-Ok "Table '$TableName' created" } else { Write-Fail "Table '$TableName' failed (may already exist)" }
}

# ============================================================
# 2. CREATE TABLES
# ============================================================

# --- EVENTS ---
New-MindMeshTable -TableId "events" -TableName "Events" -Columns @(
    @{ key="title"; type="varchar"; size=255; required=$true }
    @{ key="slug"; type="varchar"; size=255; required=$true }
    @{ key="description"; type="text"; required=$true }
    @{ key="image"; type="varchar"; size=500; required=$false }
    @{ key="eventTypeId"; type="varchar"; size=36; required=$true }
    @{ key="status"; type="enum"; elements=@("draft","review","approved","published","active","completed","cancelled"); required=$true }
    @{ key="audience"; type="enum"; elements=@("public","member_only","exclusive"); required=$true }
    @{ key="date"; type="varchar"; size=30; required=$true }
    @{ key="time"; type="varchar"; size=30; required=$true }
    @{ key="endDate"; type="varchar"; size=30; required=$false }
    @{ key="venue"; type="varchar"; size=255; required=$true }
    @{ key="location"; type="varchar"; size=500; required=$true }
    @{ key="capacity"; type="integer"; required=$true }
    @{ key="registered"; type="integer"; required=$true }
    @{ key="price"; type="float"; required=$true }
    @{ key="discountPrice"; type="float"; required=$false }
    @{ key="organizerName"; type="varchar"; size=255; required=$true }
    @{ key="organizerAvatar"; type="varchar"; size=500; required=$false }
    @{ key="ownerId"; type="varchar"; size=36; required=$true }
    @{ key="approvedBy"; type="varchar"; size=36; required=$false }
    @{ key="approvedAt"; type="varchar"; size=30; required=$false }
    @{ key="publishedAt"; type="varchar"; size=30; required=$false }
    @{ key="tags"; type="varchar"; size=255; required=$false; array=$true }
    @{ key="isFeatured"; type="boolean"; required=$true }
    @{ key="isPremium"; type="boolean"; required=$true }
    @{ key="eventDocs"; type="text"; required=$false }
    @{ key="externalLinks"; type="text"; required=$false }
    @{ key="materials"; type="text"; required=$false }
    @{ key="registrationUrl"; type="varchar"; size=500; required=$false }
    @{ key="eventWebsite"; type="varchar"; size=500; required=$false }
    @{ key="contactEmail"; type="email"; required=$false }
) -Indexes @(
    @{ key="idx_status"; type="key"; columns=@("status") }
    @{ key="idx_date"; type="key"; columns=@("date") }
    @{ key="idx_owner"; type="key"; columns=@("ownerId") }
    @{ key="idx_featured"; type="key"; columns=@("isFeatured") }
)

# --- REGISTRATIONS ---
New-MindMeshTable -TableId "registrations" -TableName "Registrations" -Columns @(
    @{ key="eventId"; type="varchar"; size=36; required=$true }
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="status"; type="enum"; elements=@("pending","approved","rejected","cancelled","waitlisted"); required=$true }
    @{ key="registeredAt"; type="varchar"; size=30; required=$true }
    @{ key="approvedBy"; type="varchar"; size=36; required=$false }
    @{ key="approvedAt"; type="varchar"; size=30; required=$false }
    @{ key="rejectionReason"; type="text"; required=$false }
    @{ key="metadata"; type="text"; required=$false }
) -Indexes @(
    @{ key="idx_event"; type="key"; columns=@("eventId") }
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_status"; type="key"; columns=@("status") }
    @{ key="idx_registered"; type="key"; columns=@("registeredAt") }
)

# --- PROJECTS ---
New-MindMeshTable -TableId "projects" -TableName "Projects" -Columns @(
    @{ key="title"; type="varchar"; size=255; required=$true }
    @{ key="description"; type="text"; required=$true }
    @{ key="image"; type="varchar"; size=500; required=$true }
    @{ key="category"; type="varchar"; size=100; required=$true }
    @{ key="status"; type="varchar"; size=50; required=$true }
    @{ key="progress"; type="integer"; required=$true }
    @{ key="technologies"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="stars"; type="integer"; required=$true }
    @{ key="forks"; type="integer"; required=$true }
    @{ key="contributors"; type="integer"; required=$true }
    @{ key="duration"; type="varchar"; size=100; required=$true }
    @{ key="isFeatured"; type="boolean"; required=$true }
    @{ key="demoUrl"; type="varchar"; size=500; required=$true }
    @{ key="repoUrl"; type="varchar"; size=500; required=$true }
    @{ key="teamMembers"; type="varchar"; size=255; required=$false; array=$true }
    @{ key="createdAt"; type="varchar"; size=30; required=$true }
) -Indexes @(
    @{ key="idx_category"; type="key"; columns=@("category") }
    @{ key="idx_featured"; type="key"; columns=@("isFeatured") }
)

# --- PROFILES ---
New-MindMeshTable -TableId "profiles" -TableName "Profiles" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="avatar"; type="varchar"; size=500; required=$false }
    @{ key="pronouns"; type="enum"; elements=@("he/him","she/her","they/them","he/they","she/they","prefer_to_say"); required=$false }
    @{ key="phone"; type="varchar"; size=20; required=$false }
    @{ key="urn"; type="varchar"; size=50; required=$false }
    @{ key="program"; type="varchar"; size=100; required=$false }
    @{ key="branch"; type="varchar"; size=100; required=$false }
    @{ key="year"; type="varchar"; size=20; required=$false }
    @{ key="semester"; type="varchar"; size=20; required=$false }
    @{ key="address"; type="text"; required=$false }
    @{ key="dateOfBirth"; type="varchar"; size=30; required=$false }
    @{ key="gender"; type="enum"; elements=@("male","female","other","prefer_not_to_say"); required=$false }
    @{ key="githubUrl"; type="varchar"; size=500; required=$false }
    @{ key="linkedinUrl"; type="varchar"; size=500; required=$false }
    @{ key="portfolioUrl"; type="varchar"; size=500; required=$false }
    @{ key="bio"; type="text"; required=$false }
    @{ key="skills"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="interests"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="experience"; type="text"; required=$false }
    @{ key="whyJoin"; type="text"; required=$false }
    @{ key="availability"; type="enum"; elements=@("full","partial","event_only"); required=$false }
    @{ key="profileVisibility"; type="enum"; elements=@("public","members_only","private"); required=$false }
    @{ key="showOnAboutPage"; type="boolean"; required=$false }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
)

# --- APPLICATIONS ---
New-MindMeshTable -TableId "applications" -TableName "Applications" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="status"; type="enum"; elements=@("pending","approved","rejected","reapplied"); required=$true }
    @{ key="profileId"; type="varchar"; size=36; required=$true }
    @{ key="oathAccepted"; type="boolean"; required=$true }
    @{ key="termsAccepted"; type="boolean"; required=$true }
    @{ key="constitutionAccepted"; type="boolean"; required=$true }
    @{ key="preferredDepartments"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="reviewedBy"; type="varchar"; size=36; required=$false }
    @{ key="reviewedAt"; type="varchar"; size=30; required=$false }
    @{ key="rejectionReason"; type="text"; required=$false }
    @{ key="submittedAt"; type="varchar"; size=30; required=$true }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_status"; type="key"; columns=@("status") }
    @{ key="idx_submitted"; type="key"; columns=@("submittedAt") }
)

# --- MEMBERSHIPS ---
New-MindMeshTable -TableId "memberships" -TableName "Memberships" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="applicationId"; type="varchar"; size=36; required=$true }
    @{ key="status"; type="enum"; elements=@("active","inactive","suspended","banned"); required=$true }
    @{ key="membershipNumber"; type="varchar"; size=20; required=$true }
    @{ key="approvedBy"; type="varchar"; size=36; required=$true }
    @{ key="approvedAt"; type="varchar"; size=30; required=$true }
    @{ key="department"; type="varchar"; size=100; required=$false }
    @{ key="joinedAt"; type="varchar"; size=30; required=$true }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_status"; type="key"; columns=@("status") }
    @{ key="idx_joined"; type="key"; columns=@("joinedAt") }
)

# --- DEPARTMENTS ---
New-MindMeshTable -TableId "departments" -TableName "Departments" -Columns @(
    @{ key="name"; type="varchar"; size=100; required=$true }
    @{ key="slug"; type="varchar"; size=100; required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="icon"; type="varchar"; size=100; required=$false }
    @{ key="color"; type="varchar"; size=20; required=$false }
    @{ key="parentId"; type="varchar"; size=36; required=$false }
    @{ key="headId"; type="varchar"; size=36; required=$false }
    @{ key="isActive"; type="boolean"; required=$true }
    @{ key="displayOrder"; type="integer"; required=$false }
    @{ key="category"; type="enum"; elements=@("technical","content","operations"); required=$true }
) -Indexes @(
    @{ key="idx_active"; type="key"; columns=@("isActive") }
    @{ key="idx_order"; type="key"; columns=@("displayOrder") }
)

# --- USER_DEPARTMENTS ---
New-MindMeshTable -TableId "user_departments" -TableName "User Departments" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="departmentId"; type="varchar"; size=36; required=$true }
    @{ key="role"; type="enum"; elements=@("member","core_member","lead"); required=$true }
    @{ key="assignedBy"; type="varchar"; size=36; required=$true }
    @{ key="assignedAt"; type="varchar"; size=30; required=$true }
    @{ key="isActive"; type="boolean"; required=$true }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_dept"; type="key"; columns=@("departmentId") }
    @{ key="idx_active"; type="key"; columns=@("isActive") }
)

# --- DESIGNATIONS ---
New-MindMeshTable -TableId "designations" -TableName "Designations" -Columns @(
    @{ key="name"; type="varchar"; size=100; required=$true }
    @{ key="slug"; type="varchar"; size=100; required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="level"; type="integer"; required=$true }
    @{ key="category"; type="enum"; elements=@("department","operations","executive","special"); required=$true }
    @{ key="departmentId"; type="varchar"; size=36; required=$false }
    @{ key="badgeIcon"; type="varchar"; size=100; required=$false }
    @{ key="badgeColor"; type="varchar"; size=20; required=$false }
    @{ key="isActive"; type="boolean"; required=$true }
    @{ key="maxHolders"; type="integer"; required=$false }
) -Indexes @(
    @{ key="idx_active"; type="key"; columns=@("isActive") }
    @{ key="idx_level"; type="key"; columns=@("level") }
)

# --- USER_DESIGNATIONS ---
New-MindMeshTable -TableId "user_designations" -TableName "User Designations" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="designationId"; type="varchar"; size=36; required=$true }
    @{ key="assignedBy"; type="varchar"; size=36; required=$true }
    @{ key="assignedAt"; type="varchar"; size=30; required=$true }
    @{ key="revokedAt"; type="varchar"; size=30; required=$false }
    @{ key="revokedBy"; type="varchar"; size=36; required=$false }
    @{ key="isActive"; type="boolean"; required=$true }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_active"; type="key"; columns=@("isActive") }
)

# --- POWERS ---
New-MindMeshTable -TableId "powers" -TableName "Powers" -Columns @(
    @{ key="name"; type="varchar"; size=100; required=$true }
    @{ key="displayName"; type="varchar"; size=100; required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="category"; type="enum"; elements=@("membership","events","tickets","content","resources","admin","gallery","social"); required=$true }
    @{ key="scope"; type="enum"; elements=@("global","department","own"); required=$true }
) -Indexes @(
    @{ key="idx_name"; type="key"; columns=@("name") }
)

# --- USER_POWERS ---
New-MindMeshTable -TableId "user_powers" -TableName "User Powers" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="powerId"; type="varchar"; size=36; required=$true }
    @{ key="grantedBy"; type="varchar"; size=36; required=$true }
    @{ key="grantedAt"; type="varchar"; size=30; required=$true }
    @{ key="departmentId"; type="varchar"; size=36; required=$false }
    @{ key="expiresAt"; type="varchar"; size=30; required=$false }
    @{ key="isActive"; type="boolean"; required=$true }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_active"; type="key"; columns=@("isActive") }
)

# --- TICKETS ---
New-MindMeshTable -TableId "tickets" -TableName "Tickets" -Columns @(
    @{ key="eventId"; type="varchar"; size=36; required=$true }
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="registrationId"; type="varchar"; size=36; required=$true }
    @{ key="ticketCode"; type="varchar"; size=20; required=$true }
    @{ key="qrData"; type="text"; required=$true }
    @{ key="status"; type="enum"; elements=@("pending","issued","active","checked_in","completed","invalidated","transferred","waitlisted"); required=$true }
    @{ key="issuedAt"; type="varchar"; size=30; required=$false }
    @{ key="checkedInAt"; type="varchar"; size=30; required=$false }
    @{ key="checkedInBy"; type="varchar"; size=36; required=$false }
    @{ key="invalidatedAt"; type="varchar"; size=30; required=$false }
    @{ key="invalidatedReason"; type="text"; required=$false }
    @{ key="transferredTo"; type="varchar"; size=36; required=$false }
    @{ key="transferHistory"; type="text"; required=$false }
    @{ key="entryCount"; type="integer"; required=$true }
    @{ key="maxEntries"; type="integer"; required=$true }
    @{ key="metadata"; type="text"; required=$false }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_event"; type="key"; columns=@("eventId") }
    @{ key="idx_issued"; type="key"; columns=@("issuedAt") }
)

# --- TICKET_VERIFICATIONS ---
New-MindMeshTable -TableId "ticket_verifications" -TableName "Ticket Verifications" -Columns @(
    @{ key="ticketId"; type="varchar"; size=36; required=$true }
    @{ key="eventId"; type="varchar"; size=36; required=$true }
    @{ key="verifiedBy"; type="varchar"; size=36; required=$true }
    @{ key="method"; type="enum"; elements=@("qr_scan","manual_search","manual_entry"); required=$true }
    @{ key="result"; type="enum"; elements=@("success","already_checked_in","invalid_ticket","event_not_active"); required=$true }
    @{ key="verifiedAt"; type="varchar"; size=30; required=$true }
    @{ key="metadata"; type="text"; required=$false }
)

# --- RESOURCES ---
New-MindMeshTable -TableId "resources" -TableName "Resources" -Columns @(
    @{ key="title"; type="varchar"; size=255; required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="type"; type="enum"; elements=@("document","link","video","file","announcement"); required=$true }
    @{ key="url"; type="varchar"; size=500; required=$false }
    @{ key="fileId"; type="varchar"; size=36; required=$false }
    @{ key="layer"; type="enum"; elements=@("common","department","role"); required=$true }
    @{ key="departmentId"; type="varchar"; size=36; required=$false }
    @{ key="designationId"; type="varchar"; size=36; required=$false }
    @{ key="tags"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="uploadedBy"; type="varchar"; size=36; required=$true }
    @{ key="isActive"; type="boolean"; required=$true }
    @{ key="displayOrder"; type="integer"; required=$false }
    @{ key="category"; type="enum"; elements=@("common","department","role"); required=$true }
    @{ key="requiredRole"; type="varchar"; size=100; required=$false }
    @{ key="uploadedByName"; type="varchar"; size=255; required=$true }
    @{ key="downloads"; type="integer"; required=$true }
) -Indexes @(
    @{ key="idx_active"; type="key"; columns=@("isActive") }
    @{ key="idx_category"; type="key"; columns=@("category") }
    @{ key="idx_dept"; type="key"; columns=@("departmentId") }
    @{ key="idx_role"; type="key"; columns=@("requiredRole") }
)

# --- NOTIFICATIONS ---
New-MindMeshTable -TableId "notifications" -TableName "Notifications" -Columns @(
    @{ key="userId"; type="varchar"; size=36; required=$true }
    @{ key="type"; type="varchar"; size=100; required=$true }
    @{ key="title"; type="varchar"; size=255; required=$true }
    @{ key="body"; type="text"; required=$true }
    @{ key="letter"; type="text"; required=$false }
    @{ key="data"; type="text"; required=$false }
    @{ key="read"; type="boolean"; required=$true }
    @{ key="readAt"; type="varchar"; size=30; required=$false }
    @{ key="createdAt"; type="varchar"; size=30; required=$true }
) -Indexes @(
    @{ key="idx_user"; type="key"; columns=@("userId") }
    @{ key="idx_read"; type="key"; columns=@("read") }
    @{ key="idx_created"; type="key"; columns=@("createdAt") }
)

# --- AUDIT_LOGS ---
New-MindMeshTable -TableId "audit_logs" -TableName "Audit Logs" -Columns @(
    @{ key="actorId"; type="varchar"; size=36; required=$true }
    @{ key="actorName"; type="varchar"; size=255; required=$true }
    @{ key="actorRole"; type="varchar"; size=50; required=$true }
    @{ key="action"; type="varchar"; size=100; required=$true }
    @{ key="entityType"; type="varchar"; size=50; required=$true }
    @{ key="entityId"; type="varchar"; size=36; required=$true }
    @{ key="details"; type="text"; required=$false }
    @{ key="ipAddress"; type="varchar"; size=45; required=$false }
    @{ key="userAgent"; type="text"; required=$false }
    @{ key="timestamp"; type="varchar"; size=30; required=$true }
) -Indexes @(
    @{ key="idx_actor"; type="key"; columns=@("actorId") }
    @{ key="idx_entity"; type="key"; columns=@("entityType","entityId") }
    @{ key="idx_action"; type="key"; columns=@("action") }
    @{ key="idx_timestamp"; type="key"; columns=@("timestamp") }
)

# --- GALLERY ---
New-MindMeshTable -TableId "gallery" -TableName "Gallery" -Columns @(
    @{ key="title"; type="varchar"; size=255; required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="imageUrl"; type="varchar"; size=500; required=$true }
    @{ key="thumbnailUrl"; type="varchar"; size=500; required=$false }
    @{ key="category"; type="enum"; elements=@("events","workshops","hackathons","team","projects","other"); required=$true }
    @{ key="uploadedBy"; type="varchar"; size=36; required=$true }
    @{ key="eventId"; type="varchar"; size=36; required=$false }
    @{ key="departmentId"; type="varchar"; size=36; required=$false }
    @{ key="status"; type="enum"; elements=@("pending","approved","rejected"); required=$true }
    @{ key="approvedBy"; type="varchar"; size=36; required=$false }
    @{ key="approvedAt"; type="varchar"; size=30; required=$false }
    @{ key="rejectionReason"; type="text"; required=$false }
    @{ key="tags"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="isActive"; type="boolean"; required=$true }
    @{ key="displayOrder"; type="integer"; required=$false }
) -Indexes @(
    @{ key="idx_status"; type="key"; columns=@("status") }
    @{ key="idx_category"; type="key"; columns=@("category") }
    @{ key="idx_active"; type="key"; columns=@("isActive") }
    @{ key="idx_order"; type="key"; columns=@("displayOrder") }
)

# --- APPROVAL_WORKFLOWS ---
New-MindMeshTable -TableId "approval_workflows" -TableName "Approval Workflows" -Columns @(
    @{ key="entityType"; type="enum"; elements=@("membership","event","registration","promotion","department_assignment"); required=$true }
    @{ key="entityId"; type="varchar"; size=36; required=$true }
    @{ key="currentStep"; type="integer"; required=$true }
    @{ key="totalSteps"; type="integer"; required=$true }
    @{ key="steps"; type="text"; required=$true }
    @{ key="status"; type="enum"; elements=@("pending","in_progress","approved","rejected"); required=$true }
    @{ key="initiatedBy"; type="varchar"; size=36; required=$true }
    @{ key="initiatedAt"; type="varchar"; size=30; required=$true }
    @{ key="completedAt"; type="varchar"; size=30; required=$false }
)

# --- EVENT_TYPES ---
New-MindMeshTable -TableId "event_types" -TableName "Event Types" -Columns @(
    @{ key="name"; type="varchar"; size=100; required=$true }
    @{ key="displayName"; type="varchar"; size=100; required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="icon"; type="varchar"; size=100; required=$false }
    @{ key="fields"; type="text"; required=$true }
    @{ key="registrationConfig"; type="text"; required=$true }
    @{ key="ticketConfig"; type="text"; required=$true }
    @{ key="workflowConfig"; type="text"; required=$true }
    @{ key="isActive"; type="boolean"; required=$true }
    @{ key="displayOrder"; type="integer"; required=$false }
) -Indexes @(
    @{ key="idx_name"; type="key"; columns=@("name") }
    @{ key="idx_active"; type="key"; columns=@("isActive") }
    @{ key="idx_order"; type="key"; columns=@("displayOrder") }
)

# --- EVENT_TYPE_DATA ---
New-MindMeshTable -TableId "event_type_data" -TableName "Event Type Data" -Columns @(
    @{ key="eventId"; type="varchar"; size=36; required=$true }
    @{ key="eventTypeId"; type="varchar"; size=36; required=$true }
    @{ key="fieldData"; type="text"; required=$true }
) -Indexes @(
    @{ key="idx_event"; type="key"; columns=@("eventId") }
)

# --- BLOGS ---
New-MindMeshTable -TableId "blogs" -TableName "Blogs" -Columns @(
    @{ key="title"; type="varchar"; size=255; required=$true }
    @{ key="slug"; type="varchar"; size=255; required=$true }
    @{ key="excerpt"; type="varchar"; size=500; required=$true }
    @{ key="content"; type="text"; required=$true }
    @{ key="coverImage"; type="varchar"; size=500; required=$true }
    @{ key="category"; type="varchar"; size=100; required=$true }
    @{ key="tags"; type="varchar"; size=100; required=$false; array=$true }
    @{ key="authorId"; type="varchar"; size=36; required=$true }
    @{ key="authorName"; type="varchar"; size=255; required=$true }
    @{ key="authorEmail"; type="email"; required=$true }
    @{ key="authorAvatar"; type="varchar"; size=500; required=$false }
    @{ key="status"; type="enum"; elements=@("draft","pending","approved","rejected"); required=$true }
    @{ key="rejectionReason"; type="text"; required=$false }
    @{ key="publishedAt"; type="varchar"; size=30; required=$false }
    @{ key="views"; type="integer"; required=$true }
    @{ key="likes"; type="integer"; required=$true }
    @{ key="featured"; type="boolean"; required=$true }
    @{ key="readTime"; type="integer"; required=$true }
) -Indexes @(
    @{ key="idx_status"; type="key"; columns=@("status") }
    @{ key="idx_slug"; type="unique"; columns=@("slug") }
    @{ key="idx_category"; type="key"; columns=@("category") }
    @{ key="idx_author"; type="key"; columns=@("authorId") }
    @{ key="idx_featured"; type="key"; columns=@("featured") }
    @{ key="idx_published"; type="key"; columns=@("publishedAt") }
)

# --- SPONSORS ---
New-MindMeshTable -TableId "sponsors" -TableName "Sponsors" -Columns @(
    @{ key="name"; type="varchar"; size=255; required=$true }
    @{ key="logo"; type="varchar"; size=500; required=$true }
    @{ key="website"; type="varchar"; size=500; required=$true }
    @{ key="tier"; type="enum"; elements=@("platinum","gold","silver","bronze","partner"); required=$true }
    @{ key="description"; type="text"; required=$false }
    @{ key="category"; type="varchar"; size=100; required=$false }
    @{ key="isActive"; type="boolean"; required=$true }
    @{ key="displayOrder"; type="integer"; required=$true }
    @{ key="featured"; type="boolean"; required=$true }
    @{ key="startDate"; type="varchar"; size=30; required=$true }
    @{ key="endDate"; type="varchar"; size=30; required=$false }
) -Indexes @(
    @{ key="idx_active"; type="key"; columns=@("isActive") }
    @{ key="idx_order"; type="key"; columns=@("displayOrder") }
    @{ key="idx_featured"; type="key"; columns=@("featured") }
    @{ key="idx_tier"; type="key"; columns=@("tier") }
)

# ============================================================
# 3. CREATE STORAGE BUCKETS
# ============================================================
Write-Step "Creating storage buckets"

$Buckets = @(
    @{ id="event-images";       name="Event Images";       maxSize=10MB; extensions=@("jpg","jpeg","png","gif","webp") }
    @{ id="sponsor-logos";      name="Sponsor Logos";      maxSize=5MB;  extensions=@("jpg","jpeg","png","svg","webp") }
    @{ id="blog-images";        name="Blog Images";        maxSize=10MB; extensions=@("jpg","jpeg","png","gif","webp") }
    @{ id="profile-pictures";   name="Profile Pictures";   maxSize=5MB;  extensions=@("jpg","jpeg","png","gif","webp") }
    @{ id="gallery-images";     name="Gallery Images";     maxSize=10MB; extensions=@("jpg","jpeg","png","gif","webp") }
    @{ id="resources";          name="Resources";          maxSize=50MB; extensions=@("pdf","doc","docx","xls","xlsx","ppt","pptx","zip","rar","txt","csv","mp4","mp3") }
    @{ id="general";            name="General Storage";    maxSize=50MB; extensions=@("jpg","jpeg","png","gif","webp","pdf","doc","docx") }
)

foreach ($b in $Buckets) {
    $bucketArgs = @(
        "storage", "create-bucket",
        "--bucket-id", $b.id,
        "--name", $b.name,
        "--permissions", 'read("any")', 'write("users")',
        "--file-security", "true",
        "--enabled", "true",
        "--maximum-file-size", "$($b.maxSize)",
        "--compression", "gzip",
        "--encryption", "true",
        "--antivirus", "true",
        "--transformations", "true"
    )
    foreach ($ext in $b.extensions) {
        $bucketArgs += "--allowed-file-extensions"
        $bucketArgs += $ext
    }

    $ok = Invoke-Appwrite $bucketArgs

    if ($ok) { Write-Ok "Bucket '$($b.name)' created" } else { Write-Fail "Bucket '$($b.name)' failed (may already exist)" }
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host "  Setup Complete!" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  Success : $SuccessCount" -ForegroundColor Green
Write-Host "  Skipped : $SkipCount (already exist)" -ForegroundColor Yellow
Write-Host "  Failed  : $FailCount" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Add to .env.local: NEXT_PUBLIC_APPWRITE_DATABASE_ID=$DB_ID"
Write-Host "  2. Update permissions in Appwrite Console as needed"
Write-Host "  3. Seed initial data (event types, powers, departments)"
