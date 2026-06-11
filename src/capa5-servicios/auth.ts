// CAPA 5 — Servicio de autenticación (hash de contraseñas)

import { UserProfile } from "../capa1-dominio";

const SALT = "simunet_wifi_v1";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  if (!stored) return password.length === 0;
  return (await hashPassword(password)) === stored;
}

export async function ensureProfilePassword(
  profile: UserProfile,
  plainPassword: string
): Promise<UserProfile> {
  return { ...profile, password: await hashPassword(plainPassword) };
}
