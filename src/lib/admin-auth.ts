import { jwtVerify, SignJWT } from "jose";

export const ADMIN_SESSION_COOKIE = "sarita_admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 8 * 60 * 60;

const sessionIssuer = "sarita-joyeria";
const sessionAudience = "sarita-admin";
const bcryptHashPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function validateAdminAuthConfig(): void {
  const missingVariables = (
    ["ADMIN_USER", "ADMIN_PASSWORD_HASH", "SESSION_SECRET"] as const
  ).filter((name) => !process.env[name]?.trim());

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required admin authentication environment variables: ${missingVariables.join(", ")}`,
    );
  }

  if (process.env.SESSION_SECRET!.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  if (!bcryptHashPattern.test(process.env.ADMIN_PASSWORD_HASH!)) {
    throw new Error("ADMIN_PASSWORD_HASH must be a valid bcrypt hash.");
  }
}

function getSessionKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32
    ? new TextEncoder().encode(secret)
    : null;
}

export async function createAdminSessionToken(): Promise<string> {
  validateAdminAuthConfig();
  const key = getSessionKey();
  if (!key) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(sessionIssuer)
    .setAudience(sessionAudience)
    .setSubject(process.env.ADMIN_USER!)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<boolean> {
  const key = getSessionKey();
  const adminUser = process.env.ADMIN_USER;
  if (!token || !key || !adminUser) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      audience: sessionAudience,
      issuer: sessionIssuer,
    });
    return payload.sub === adminUser;
  } catch {
    return false;
  }
}

export function getAdminSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return undefined;
  }

  const sessionCookie = `${ADMIN_SESSION_COOKIE}=`;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(sessionCookie));

  return cookie?.slice(sessionCookie.length);
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  return verifyAdminSessionToken(getAdminSessionToken(request));
}
