import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteProductImage,
} from "@/lib/imagekit";
import { isImageKitFileInUse } from "@/lib/product-repository";
import { parseJsonBody } from "@/lib/api-validation";

const fileInputSchema = z.object({
  fileId: z.string().trim().min(1).max(128),
}).strict();

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, fileInputSchema);
  if (!parsedBody.success) return parsedBody.response;
  const { fileId } = parsedBody.data;

  try {
    if (await isImageKitFileInUse(fileId)) {
      return Response.json(
        { error: "La imagen todavía está asociada a un producto." },
        { status: 409 },
      );
    }

    await deleteProductImage(fileId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("No se pudo borrar el archivo de ImageKit:", error);
    return Response.json(
      { error: "No se pudo borrar la imagen. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
