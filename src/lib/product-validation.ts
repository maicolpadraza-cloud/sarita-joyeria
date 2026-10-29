import { z } from "zod";
import {
  type Product,
  type ProductCategory,
  type ProductMaterial,
} from "@/lib/products";

export type ProductInput = Omit<Product, "id"> & { id?: string };

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
      return (
        url.protocol === "https:" &&
        url.hostname === "images.unsplash.com" &&
        url.port === "" &&
        url.username === "" &&
        url.password === ""
      );
    } catch {
      return false;
    }
  }, "La imagen debe ser una ruta del sitio o una URL HTTPS de images.unsplash.com.");

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
    description: z.string().max(300),
    inStock: z.boolean(),
  })
  .strict();

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
): Product;
export function validateProductInput(
  value: unknown,
  options?: { requireId?: false },
): ProductInput;
export function validateProductInput(
  value: unknown,
  options: { requireId?: boolean } = {},
): ProductInput | Product {
  const parsed = productInputSchema.safeParse(value);
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
    return { ...parsed.data, id };
  }
  return parsed.data;
}
