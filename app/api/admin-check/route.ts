import { NextResponse } from "next/server";
import { Client, Account } from "appwrite";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAILS_FALLBACK || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    const sessionCookie = request.headers.get("cookie") || "";
    const sessionMatch = sessionCookie.match(/a_session_[^=]+=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const sessionId = sessionMatch[1];

    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

      const account = new Account(client);
      const session = await account.getSession({ sessionId: "current" });

      if (!session || session.$id !== sessionId) {
        return NextResponse.json({ isAdmin: false }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());

    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
