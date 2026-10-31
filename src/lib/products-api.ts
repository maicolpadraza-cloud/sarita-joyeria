import {
  ProductValidationError,
  validateProductInput,
} from "@/lib/product-validation";
import type { AdminProduct, Product, ProductInput } from "@/lib/products";

export interface ProductWriteResult {
  product: AdminProduct;
  warning?: string;
}

export class ProductsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProductsApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(10_000),
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "La consulta del catálogo tardó demasiado. Inténtalo de nuevo."
        : "No se pudo conectar con el catálogo. Comprueba tu conexión e inténtalo de nuevo.";
    throw new ProductsApiError(message);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProductsApiError(
      "La API devolvió una respuesta que no se pudo interpretar.",
      response.ok ? 502 : response.status,
    );
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `La solicitud a la API falló (HTTP ${response.status}).`;
    throw new ProductsApiError(message, response.status);
  }

  return payload;
}

function parseProduct(value: unknown): AdminProduct {
  try {
    return validateProductInput(value, { requireId: true });
  } catch (error) {
    const message =
      error instanceof ProductValidationError
        ? error.message
        : "La API devolvió un producto inválido.";
    throw new ProductsApiError(message, 502);
  }
}

export async function fetchProducts(): Promise<AdminProduct[]> {
  const payload = await requestJson("/api/products");
  if (!isRecord(payload) || !Array.isArray(payload.products)) {
    throw new ProductsApiError("La API devolvió una lista de productos inválida.", 502);
  }

  return payload.products.map(parseProduct);
}

export async function fetchProductById(
  id: string,
): Promise<Product | null> {
  try {
    const payload = await requestJson(
      `/api/products/${encodeURIComponent(id)}`,
    );
    if (!isRecord(payload) || !("product" in payload)) {
      throw new ProductsApiError("La API devolvió un producto inválido.", 502);
    }
    return parseProduct(payload.product);
  } catch (error) {
    if (error instanceof ProductsApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveProduct(
  product: ProductInput,
): Promise<ProductWriteResult> {
  const payload = await requestJson("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  if (!isRecord(payload) || !("product" in payload)) {
    throw new ProductsApiError("La API no confirmó la creación del producto.", 502);
  }
  return {
    product: parseProduct(payload.product),
    ...(typeof payload.warning === "string" ? { warning: payload.warning } : {}),
  };
}

export async function updateProductApi(
  id: string,
  product: ProductInput,
): Promise<ProductWriteResult> {
  const payload = await requestJson(
    `/api/products/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(product),
    },
  );
  if (!isRecord(payload) || !("product" in payload)) {
    throw new ProductsApiError("La API no confirmó la actualización del producto.", 502);
  }
  return {
    product: parseProduct(payload.product),
    ...(typeof payload.warning === "string" ? { warning: payload.warning } : {}),
  };
}

export async function removeProduct(id: string): Promise<string | undefined> {
  const payload = await requestJson(
    `/api/products/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!isRecord(payload) || payload.ok !== true) {
    throw new ProductsApiError("La API no confirmó la eliminación del producto.", 502);
  }
  return typeof payload.warning === "string" ? payload.warning : undefined;
}

export async function deletePendingImageKitFile(fileId: string): Promise<void> {
  await requestJson("/api/imagekit/file", {
    method: "DELETE",
    body: JSON.stringify({ fileId }),
  });
}
