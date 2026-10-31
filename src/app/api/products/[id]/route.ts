import {
  isImageKitFileInUse,
  deleteProduct,
  getImageKitFileId,
  getProductById,
  updateProduct,
} from "@/lib/product-repository";
import { deleteProductImage } from "@/lib/imagekit";
import {
  productIdSchema,
  productInputSchema,
} from "@/lib/product-validation";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseJsonBody } from "@/lib/api-validation";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: ProductRouteContext,
) {
  const { id } = await params;
  const parsedId = productIdSchema.safeParse(id);
  if (!parsedId.success) {
    return Response.json(
      { error: "El identificador del producto no es válido." },
      { status: 400 },
    );
  }

  try {
    const product = await getProductById(parsedId.data);
    if (!product) {
      return Response.json(
        { error: "No se encontró el producto solicitado." },
        { status: 404 },
      );
    }

    return Response.json({ product });
  } catch (error) {
    console.error("Error al consultar el producto:", error);
    return Response.json(
      { error: "No se pudo cargar el producto. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: ProductRouteContext,
) {
  if (!(await isAdminRequest(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const parsedId = productIdSchema.safeParse(id);
  if (!parsedId.success) {
    return Response.json(
      { error: "El identificador del producto no es válido." },
      { status: 400 },
    );
  }

  const parsedBody = await parseJsonBody(request, productInputSchema);
  if (!parsedBody.success) return parsedBody.response;
  const input = parsedBody.data;

  try {
    const previousImageKitFileId = await getImageKitFileId(parsedId.data);
    const updatedProduct = await updateProduct(parsedId.data, input);
    if (!updatedProduct) {
      return Response.json(
        { error: "No se encontró el producto que deseas actualizar." },
        { status: 404 },
      );
    }

    let warning: string | undefined;
    if (
      previousImageKitFileId &&
      previousImageKitFileId !== input.imageKitFileId
    ) {
      try {
        if (!(await isImageKitFileInUse(previousImageKitFileId))) {
          await deleteProductImage(previousImageKitFileId);
        }
      } catch (error) {
        console.error("No se pudo borrar la imagen reemplazada de ImageKit:", error);
        warning =
          "El producto se actualizó, pero no se pudo borrar la imagen anterior de ImageKit.";
      }
    }

    return Response.json({
      product: updatedProduct,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return Response.json(
      { error: "No se pudo actualizar el producto. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: ProductRouteContext,
) {
  if (!(await isAdminRequest(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const parsedId = productIdSchema.safeParse(id);
  if (!parsedId.success) {
    return Response.json(
      { error: "El identificador del producto no es válido." },
      { status: 400 },
    );
  }

  try {
    const imageKitFileId = await getImageKitFileId(parsedId.data);
    const deleted = await deleteProduct(parsedId.data);
    if (!deleted) {
      return Response.json(
        { error: "No se encontró el producto que deseas eliminar." },
        { status: 404 },
      );
    }

    let warning: string | undefined;
    if (imageKitFileId) {
      try {
        if (!(await isImageKitFileInUse(imageKitFileId))) {
          await deleteProductImage(imageKitFileId);
        }
      } catch (error) {
        console.error("No se pudo borrar la imagen del producto de ImageKit:", error);
        warning =
          "El producto se eliminó, pero no se pudo borrar su imagen de ImageKit.";
      }
    }

    return Response.json({ ok: true, ...(warning ? { warning } : {}) });
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return Response.json(
      { error: "No se pudo eliminar el producto. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
