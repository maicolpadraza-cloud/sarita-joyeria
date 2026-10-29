import { randomUUID } from "node:crypto";
import {
  createProduct,
  getAllProducts,
} from "@/lib/product-repository";
import { productInputSchema } from "@/lib/product-validation";
import type { Product } from "@/lib/products";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseJsonBody } from "@/lib/api-validation";

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
  if (!(await isAdminRequest(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 },
    );
  }

  const parsedBody = await parseJsonBody(request, productInputSchema);
  if (!parsedBody.success) return parsedBody.response;
  const input = parsedBody.data;

  try {
    const product: Product = {
      ...input,
      id: input.id ?? randomUUID(),
    };
    const createdProduct = await createProduct(product);
    return Response.json({ product: createdProduct }, { status: 201 });
  } catch (error) {
    if (isDuplicateIdError(error)) {
      return Response.json(
        { error: "No se pudo crear el producto con esos datos." },
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
