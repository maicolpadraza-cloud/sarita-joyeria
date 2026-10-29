import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/product-repository";
import {
  productIdSchema,
  productInputSchema,
} from "@/lib/product-validation";
import type { Product } from "@/lib/products";
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
    const product: Product = { ...input, id: parsedId.data };
    const updatedProduct = await updateProduct(parsedId.data, product);
    if (!updatedProduct) {
      return Response.json(
        { error: "No se encontró el producto que deseas actualizar." },
        { status: 404 },
      );
    }

    return Response.json({ product: updatedProduct });
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
    const deleted = await deleteProduct(parsedId.data);
    if (!deleted) {
      return Response.json(
        { error: "No se encontró el producto que deseas eliminar." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return Response.json(
      { error: "No se pudo eliminar el producto. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
