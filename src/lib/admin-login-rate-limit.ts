import { createHash } from "node:crypto";
import { isIP } from "node:net";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

const maximumAttempts = 5;
const cleanupInterval = 100;
let loginRequestCount = 0;

function getIpHash(ipAddress: string): string {
  return createHash("sha256").update(ipAddress).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",", 1)[0]
    ?.trim();
  const ipAddress =
    request.headers.get("x-real-ip")?.trim() || forwardedIp || "unknown";

  return isIP(ipAddress) ? ipAddress : "unknown";
}

export async function isLoginAttemptAllowed(
  ipAddress: string,
): Promise<boolean> {
  const ipHash = getIpHash(ipAddress);
  await db.execute(
    `INSERT INTO admin_login_attempts
      (ip_hash, window_started_at, attempt_count)
     VALUES (?, UTC_TIMESTAMP(), 1)
     ON DUPLICATE KEY UPDATE
      attempt_count = IF(
        window_started_at <= UTC_TIMESTAMP() - INTERVAL 15 MINUTE,
        1,
        LEAST(attempt_count + 1, 6)
      ),
      window_started_at = IF(
        window_started_at <= UTC_TIMESTAMP() - INTERVAL 15 MINUTE,
        UTC_TIMESTAMP(),
        window_started_at
      )`,
    [ipHash],
  );

  const [rows] = await db.execute<(RowDataPacket & { attempt_count: number })[]>(
    `SELECT attempt_count
     FROM admin_login_attempts
     WHERE ip_hash = ?`,
    [ipHash],
  );

  loginRequestCount++;
  if (loginRequestCount % cleanupInterval === 0) {
    await db.execute(
      `DELETE FROM admin_login_attempts
       WHERE window_started_at < UTC_TIMESTAMP() - INTERVAL 1 DAY
       LIMIT 1000`,
    );
  }

  return rows[0]?.attempt_count <= maximumAttempts;
}

export async function resetLoginAttempts(ipAddress: string): Promise<void> {
  await db.execute("DELETE FROM admin_login_attempts WHERE ip_hash = ?", [
    getIpHash(ipAddress),
  ]);
}
