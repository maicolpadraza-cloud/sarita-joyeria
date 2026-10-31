import { z } from "zod";
import {
  type AdminProduct,
  type ProductCategory,
  type ProductInput,
  type ProductMaterial,
} from "@/lib/products";

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

const productCategories = [
  "Aritos",
  "Argollas",
  "Collares",
  "Dijes",
  "Rosarios",
  "Anillos",
  "Pulseras",
  "Piercings",
  "Titanio",
  "Conjuntos",
  "Relojes",
  "Carteras",
  "Billeteras",
  "Mini joyeros",
  "Varones",
  "Tobilleras",
] as const satisfies readonly ProductCategory[];
const productMaterials = [
  "Xuping",
  "Magold",
  "Folleado",
  "Acero",
  "Titanio",
  "Artesanal",
  "Cuero sintético",
] as const satisfies readonly ProductMaterial[];
const accessoryTypes = ["Cadenas", "Pulseras", "Anillos", "Billeteras"] as const;
const closureTypes = ["Mariposa", "Tapa Plana", "Argolla"] as const;
const productSubcategories = ["Iniciales"] as const;
const maxProductPrice = 99_999_999.99;
const imageKitEndpointPath = (() => {
  const endpoint =
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ??
    "https://ik.imagekit.io/sxvg5dlmq";
  try {
    const url = new URL(endpoint);
    if (
      url.protocol === "https:" &&
      url.hostname === "ik.imagekit.io" &&
      url.port === "" &&
      url.username === "" &&
      url.password === ""
    ) {
      return url.pathname.replace(/\/+$/, "");
    }
  } catch {
    return "/sxvg5dlmq";
  }
  return "/sxvg5dlmq";
})();

const imageUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((value) => {
    if (/[\u0000-\u0020"'<>`\\]/.test(value)) {
      return false;
    }

    if (value.startsWith("/") && !value.startsWith("//")) {
      try {
        return (
          new URL(value, "https://sarita.invalid").origin ===
          "https://sarita.invalid"
        );
      } catch {
        return false;
      }
    }

    try {
      const url = new URL(value);
      const isUnsplash =
        url.protocol === "https:" &&
        url.hostname === "images.unsplash.com" &&
        url.port === "" &&
        url.username === "" &&
        url.password === "";
      const isImageKit =
        url.protocol === "https:" &&
        url.hostname === "ik.imagekit.io" &&
        url.port === "" &&
        url.username === "" &&
        url.password === "" &&
        (url.pathname === imageKitEndpointPath ||
          url.pathname.startsWith(`${imageKitEndpointPath}/`));
      return isUnsplash || isImageKit;
    } catch {
      return false;
    }
  }, "La imagen debe ser una ruta del sitio o una URL HTTPS permitida.");

export function isAllowedProductImageUrl(value: string): boolean {
  return imageUrlSchema.safeParse(value).success;
}

export const productInputSchema = z
  .object({
    id: z.string().trim().min(1).max(64).optional(),
    name: z.string().trim().min(1).max(150),
    category: z.enum(productCategories),
    subcategory: z.enum(productSubcategories).optional(),
    accessoryType: z.enum(accessoryTypes).optional(),
    material: z.enum(productMaterials),
    closureType: z.enum(closureTypes).optional(),
    price: z
      .number()
      .finite()
      .min(0)
      .max(maxProductPrice)
      .refine((value) => Number(value.toFixed(2)) === value),
    image: imageUrlSchema,
    imageKitFileId: z.string().trim().min(1).max(128).optional(),
    description: z.string().max(300),
    inStock: z.boolean(),
  })
  .strict();

const productRecordSchema = productInputSchema.extend({
  id: z.string().trim().min(1).max(64),
  code: z.string().regex(/^SJ-\d{4,}$/),
}).strict();

export const productIdSchema = z.string().trim().min(1).max(64);

export function isProductCategory(value: unknown): value is ProductCategory {
  return productCategories.some((category) => category === value);
}

export function isProductMaterial(value: unknown): value is ProductMaterial {
  return productMaterials.some((material) => material === value);
}

export function validateProductInput(
  value: unknown,
  options: { requireId: true },
): AdminProduct;
export function validateProductInput(
  value: unknown,
  options?: { requireId?: false },
): ProductInput;
export function validateProductInput(
  value: unknown,
  options: { requireId?: boolean } = {},
): ProductInput | AdminProduct {
  const parsed = options.requireId
    ? productRecordSchema.safeParse(value)
    : productInputSchema.safeParse(value);
  if (!parsed.success) {
    throw new ProductValidationError(
      parsed.error.issues[0]?.message ?? "Los datos del producto no son válidos.",
    );
  }

  const id = parsed.data.id;
  if (options.requireId && !id) {
    throw new ProductValidationError("El identificador del producto no es válido.");
  }

  if (options.requireId) {
    return { ...parsed.data, id } as AdminProduct;
  }
  return parsed.data;
}
