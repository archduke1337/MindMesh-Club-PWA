import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID, Query } from "appwrite";

export async function POST(request: NextRequest) {
  try {
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
        name: application.name,
        email: application.email,
        phone: application.phone,
        department: application.department || "unassigned",
        status: "member",
      });

      await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
        userId: application.userId,
        type: "membership_approved",
        title: "Membership Approved!",
        body: `Congratulations! Your membership has been approved. Membership ID: ${membershipId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });

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

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Membership API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
