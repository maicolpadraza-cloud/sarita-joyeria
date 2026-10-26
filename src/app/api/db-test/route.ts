import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type CategoryCountRow = RowDataPacket & {
  total: number;
};

export async function GET() {
  try {
    const [rows] = await db.query<CategoryCountRow[]>(
      "SELECT COUNT(*) AS total FROM categories",
    );

    return Response.json({ ok: true, categories: Number(rows[0].total) });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con MySQL.",
      },
      { status: 500 },
    );
  }
}
