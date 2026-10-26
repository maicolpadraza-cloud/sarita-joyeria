import { randomUUID } from "node:crypto";
import {
  createProduct,
  getAllProducts,
} from "@/lib/product-repository";
import {
  ProductValidationError,
  validateProductInput,
} from "@/lib/product-validation";
import type { Product } from "@/lib/products";

export async function GET() {
  try {
    const products = await getAllProducts();
    return Response.json({ products });
  } catch (error) {
    console.error("Error al consultar los productos:", error);
    return Response.json(
      { error: "No se pudo cargar el catálogo. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const product: Product = {
      ...input,
      id: input.id ?? randomUUID(),
    };
    const createdProduct = await createProduct(product);
    return Response.json({ product: createdProduct }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (isDuplicateIdError(error)) {
      return Response.json(
        { error: "Ya existe un producto con ese identificador." },
        { status: 400 },
      );
    }

    console.error("Error al crear el producto:", error);
    return Response.json(
      { error: "No se pudo crear el producto. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}

function isDuplicateIdError(
  error: unknown,
): error is Error & { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}
