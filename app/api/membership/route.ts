import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID, Query } from "appwrite";
import { sendEmail, welcomeEmailTemplate, rejectionEmailTemplate } from "@/lib/emailService";

function hasSession(request: NextRequest): boolean {
  return Array.from(request.cookies).some(
    ([name]) => name.startsWith("a_session_") && name !== "a_session_" && name.length > "a_session_".length
  );
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  if (!hasSession(request)) return false;
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/a_session_[^=]+=([^;]+)/);
    if (!sessionMatch) return false;

    const client = new (await import("appwrite")).Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setSession(sessionMatch[1]);
    const account = new (await import("appwrite")).Account(client);
    const user = await account.get();
    const { databases } = createAdminClient();
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal("email", [user.email]),
      Query.equal("status", ["admin"]),
      Query.limit(1),
    ]);
    return response.documents.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, action, reason } = await request.json();

    if (!applicationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const application = await databases.getDocument(DATABASE_ID, COLLECTIONS.APPLICATIONS, applicationId);

    if (action === "approve") {
      const membershipId = `MM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.APPLICATIONS, applicationId, {
        status: "approved",
        reviewedAt: new Date().toISOString(),
      });

      await databases.createDocument(DATABASE_ID, COLLECTIONS.MEMBERSHIPS, ID.unique(), {
        userId: application.userId,
        membershipId,
        department: application.department || "unassigned",
        status: "active",
        approvedAt: new Date().toISOString(),
      });

      await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, application.userId, {
        userId: application.userId,
        phone: application.phone,
      });

      await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
        userId: application.userId,
        type: "membership_approved",
        title: "Membership Approved!",
        body: `Congratulations! Your membership has been approved. Membership ID: ${membershipId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      const emailTemplate = welcomeEmailTemplate(
        application.name,
        membershipId,
        application.department || "unassigned"
      );
      await sendEmail({ to: application.email, ...emailTemplate });

      return NextResponse.json({ success: true, membershipId });
    }

    if (action === "reject") {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.APPLICATIONS, applicationId, {
        status: "rejected",
        rejectionReason: reason || "Application rejected",
        reviewedAt: new Date().toISOString(),
      });

      await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
        userId: application.userId,
        type: "membership_rejected",
        title: "Application Update",
        body: reason || "Your application was not approved at this time.",
        read: false,
        createdAt: new Date().toISOString(),
      });

      try {
        const template = rejectionEmailTemplate(application.name, reason || "Application rejected");
        await sendEmail({ to: application.email, ...template });
      } catch (e) { console.error("Rejection email failed:", e); }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Membership API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
