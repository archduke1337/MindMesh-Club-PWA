import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ isAdmin: false });
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal("email", [email]),
      Query.equal("status", ["admin"]),
      Query.limit(1),
    ]);

    return NextResponse.json({ isAdmin: response.documents.length > 0 });
  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
