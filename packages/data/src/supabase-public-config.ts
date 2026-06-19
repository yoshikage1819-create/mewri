export function isValidSupabaseProjectUrl(projectUrl: string): boolean {
  try {
    const parsed = new URL(projectUrl);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function isPublicAnonKey(anonKey: string): boolean {
  const key = anonKey.trim();
  if (key.startsWith("sb_publishable_")) {
    return true;
  }

  if (key.startsWith("sb_secret_")) {
    return false;
  }

  const payload = decodeJwtPayload(key);
  return payload?.role === "anon";
}

export function isPrivilegedSupabaseCredential(credential: string): boolean {
  const key = credential.trim();
  if (key.startsWith("sb_secret_")) {
    return true;
  }

  const payload = decodeJwtPayload(key);
  return payload?.role === "service_role";
}

function decodeJwtPayload(token: string): { role?: unknown } | undefined {
  const [, payload] = token.split(".");
  if (!payload) {
    return undefined;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const parsed = JSON.parse(globalThis.atob(padded)) as { role?: unknown };
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}
