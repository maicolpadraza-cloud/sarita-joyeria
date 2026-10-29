import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.execute("SELECT 1");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Database health check failed:", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
