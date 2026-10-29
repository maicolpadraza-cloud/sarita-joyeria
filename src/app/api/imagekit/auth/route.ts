import { getUploadAuthParams } from "@imagekit/next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("Falta configurar la autenticación de ImageKit.");
    return Response.json(
      { error: "La carga de imágenes no está configurada." },
      { status: 503 },
    );
  }

  try {
    const auth = getUploadAuthParams({ publicKey, privateKey });
    return Response.json(
      { ...auth, publicKey },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudo generar la firma de ImageKit:", error);
    return Response.json(
      { error: "No se pudo preparar la carga de la imagen." },
      { status: 500 },
    );
  }
}
