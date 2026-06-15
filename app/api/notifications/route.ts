import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID, Query } from "appwrite";

function hasSession(request: NextRequest): boolean {
  return Array.from(request.cookies).some(
    ([name]) => name.startsWith("a_session_") && name !== "a_session_" && name.length > "a_session_".length
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, type, title, body, data } = await request.json();

    if (!userId || !type || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const notification = await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : "{}",
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Notification send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!hasSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { databases } = createAdminClient();
    const { Query } = await import("appwrite");

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal("userId", [userId]),
      Query.orderDesc("createdAt"),
      Query.limit(limit),
    ]);

    return NextResponse.json({ notifications: response.documents });
  } catch (error) {
    console.error("Notification fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
