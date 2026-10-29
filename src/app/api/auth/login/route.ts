import bcrypt from "bcryptjs";
import { timingSafeEqual, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_DURATION_SECONDS,
  createAdminSessionToken,
  validateAdminAuthConfig,
} from "@/lib/admin-auth";
import {
  getClientIp,
  isLoginAttemptAllowed,
  resetLoginAttempts,
} from "@/lib/admin-login-rate-limit";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api-validation";

const loginInputSchema = z
  .object({
    username: z.string().min(1).max(256),
    password: z
      .string()
      .min(1)
      .max(256)
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  })
  .strict();

function constantTimeStringEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export async function POST(request: Request) {
  try {
    validateAdminAuthConfig();
  } catch (error) {
    console.error("Admin authentication is not configured:", error);
    return NextResponse.json(
      { error: "La autenticación del administrador no está configurada." },
      { status: 500 },
    );
  }

  const ipAddress = getClientIp(request);
  let allowed: boolean;
  try {
    allowed = await isLoginAttemptAllowed(ipAddress);
  } catch (error) {
    console.error("Could not check admin login rate limit:", error);
    return NextResponse.json(
      { error: "No se pudo validar el inicio de sesión. Inténtalo más tarde." },
      { status: 503 },
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  const parsedBody = await parseJsonBody(
    request,
    loginInputSchema,
    "credenciales inválidas",
  );
  if (!parsedBody.success) {
    if (parsedBody.response.status === 413) return parsedBody.response;
    return NextResponse.json(
      { error: "credenciales inválidas" },
      { status: 401 },
    );
  }
  const { username, password } = parsedBody.data;

  let passwordMatches = false;
  try {
    passwordMatches = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH!,
    );
  } catch (error) {
    console.error("Could not verify admin password hash:", error);
    return NextResponse.json(
      { error: "No se pudo validar el inicio de sesión." },
      { status: 500 },
    );
  }
  const usernameMatches = constantTimeStringEqual(
    username,
    process.env.ADMIN_USER!,
  );

  if (!usernameMatches || !passwordMatches) {
    return NextResponse.json(
      { error: "credenciales inválidas" },
      { status: 401 },
    );
  }

  try {
    const token = await createAdminSessionToken();
    await resetLoginAttempts(ipAddress);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_DURATION_SECONDS,
      expires: new Date(Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000),
    });
    return response;
  } catch (error) {
    console.error("Could not create admin session:", error);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión. Inténtalo de nuevo." },
      { status: 503 },
    );
  }
}
