import { isAdminRequest } from "@/lib/admin-auth";
import { getProductImageStorageUsage } from "@/lib/imagekit";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const usedBytes = await getProductImageStorageUsage();
    return Response.json(
      { usedBytes, limitBytes: 5 * 1024 ** 3 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudo consultar el almacenamiento de ImageKit:", error);
    return Response.json(
      { error: "No se pudo consultar el espacio de imágenes." },
      { status: 502 },
    );
  }
}
