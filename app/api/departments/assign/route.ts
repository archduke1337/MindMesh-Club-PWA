import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID } from "appwrite";

export async function POST(request: NextRequest) {
  try {
    const { userId, departmentId, departmentName } = await request.json();

    if (!userId || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    await databases.createDocument(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, ID.unique(), {
      userId,
      departmentId,
      assignedAt: new Date().toISOString(),
      status: "active",
    });

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      department: departmentName || departmentId,
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "department_assigned",
      title: "Department Assignment",
      body: `You have been assigned to ${departmentName || departmentId}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Department assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
