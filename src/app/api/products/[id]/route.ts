import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/product-repository";
import {
  ProductValidationError,
  validateProductInput,
} from "@/lib/product-validation";
import type { Product } from "@/lib/products";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: ProductRouteContext,
) {
  const { id } = await params;
  if (id.length === 0 || id.length > 64) {
    return Response.json(
      { error: "El identificador del producto no es válido." },
      { status: 400 },
    );
  }

  try {
    const product = await getProductById(id);
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
  if (process.env.NODE_ENV === "production") {
    // TODO: Add real administrator authentication and authorization before publishing.
    return Response.json(
      {
        error:
          "Escritura deshabilitada hasta implementar autenticación de administrador",
      },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (id.length === 0 || id.length > 64) {
    return Response.json(
      { error: "El identificador del producto no es válido." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "El cuerpo de la solicitud no contiene JSON válido." },
      { status: 400 },
    );
  }

  try {
    const input = validateProductInput(body);
    const product: Product = { ...input, id };
    const updatedProduct = await updateProduct(id, product);
    if (!updatedProduct) {
      return Response.json(
        { error: "No se encontró el producto que deseas actualizar." },
        { status: 404 },
      );
    }

    return Response.json({ product: updatedProduct });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("Error al actualizar el producto:", error);
    return Response.json(
      { error: "No se pudo actualizar el producto. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: ProductRouteContext,
) {
  if (process.env.NODE_ENV === "production") {
    // TODO: Add real administrator authentication and authorization before publishing.
    return Response.json(
      {
        error:
          "Escritura deshabilitada hasta implementar autenticación de administrador",
      },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (id.length === 0 || id.length > 64) {
    return Response.json(
      { error: "El identificador del producto no es válido." },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteProduct(id);
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
