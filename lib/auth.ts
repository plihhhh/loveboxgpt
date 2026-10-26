import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type Role = "admin" | "user";

export type AuthPayload = {
  username: string;
  role: Role;
};

const COOKIE_NAME = "robolove_token";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET belum diatur atau terlalu pendek.");
  }
  return secret;
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token?: string): AuthPayload | null {
  if (!token) return null;

  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export function authCookieName() {
  return COOKIE_NAME;
}
