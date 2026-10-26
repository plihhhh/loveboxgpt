import { NextResponse } from "next/server";
import { authCookieName, signToken, Role } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { message: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  const username = String(body.username).trim();
  const password = String(body.password);

  let role: Role | null = null;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    role = "admin";
  }

  if (
    username === process.env.USER_USERNAME &&
    password === process.env.USER_PASSWORD
  ) {
    role = "user";
  }

  if (!role) {
    return NextResponse.json(
      { message: "Username atau password salah." },
      { status: 401 }
    );
  }

  const token = signToken({ username, role });

  const response = NextResponse.json({
    ok: true,
    role
  });

  response.cookies.set(authCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
