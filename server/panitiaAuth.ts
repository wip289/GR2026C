// ─── PANITIA AUTH ───────────────────────────────────────────────
// Password panitia/admin disimpan HASHED di eventConfig (prefix secret_),
// dikelola dari SuperAdmin. Setelah verify, server kasih token HMAC 12 jam.
// Token dikirim client via header `x-panitia-token`.
// PENTING: key dengan prefix `secret_` TIDAK BOLEH keluar lewat getEventConfig publik.

import crypto from "crypto";
import { getConfigValue, setEventConfig } from "./db";

const SALT = "gr2026-panitia-v1"; // salt statis cukup untuk use case ini
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam

export type PanitiaRole = "panitia" | "admin";

export function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(SALT + plain).digest("hex");
}

// Secret HMAC token: dibuat random sekali, disimpan di eventConfig (secret_).
let cachedTokenSecret: string | null = null;
async function getTokenSecret(): Promise<string> {
  if (cachedTokenSecret) return cachedTokenSecret;
  let secret = await getConfigValue("secret_tokenSecret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await setEventConfig({ secret_tokenSecret: secret });
  }
  cachedTokenSecret = secret;
  return secret;
}

// Default = password lama (hardcoded sebelumnya), supaya transisi mulus.
// Setelah deploy, ganti via SuperAdmin → hash baru tersimpan di DB.
const DEFAULT_HASHES: Record<PanitiaRole, string> = {
  panitia: hashPassword("GR2026@Panitia"),
  admin: hashPassword("GR2026@Admin"),
};

export async function verifyPassword(role: PanitiaRole, plain: string): Promise<boolean> {
  const key = role === "admin" ? "secret_adminPasswordHash" : "secret_panitiaPasswordHash";
  const stored = (await getConfigValue(key)) ?? DEFAULT_HASHES[role];
  const given = hashPassword(plain);
  return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(given));
}

export async function setPassword(role: PanitiaRole, plain: string): Promise<void> {
  const key = role === "admin" ? "secret_adminPasswordHash" : "secret_panitiaPasswordHash";
  await setEventConfig({ [key]: hashPassword(plain) });
}

// Token format: role.expiryMs.hmac
export async function issueToken(role: PanitiaRole): Promise<string> {
  const secret = await getTokenSecret();
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${role}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export async function verifyToken(token: string | undefined): Promise<PanitiaRole | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, expStr, sig] = parts;
  if (role !== "panitia" && role !== "admin") return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  const secret = await getTokenSecret();
  const expected = crypto.createHmac("sha256", secret).update(`${role}.${expStr}`).digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return role as PanitiaRole;
}
