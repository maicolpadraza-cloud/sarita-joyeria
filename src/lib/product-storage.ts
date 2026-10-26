import {
  categories,
  products,
  type Product,
  type ProductCategory,
  type ProductMaterial,
  type MasculineAccessoryType,
} from "@/lib/products";

const PRODUCTS_STORAGE_KEY = "sarita-products-v1";
export const PRODUCTS_UPDATED_EVENT = "sarita-products-updated";
const validMaterials: ProductMaterial[] = [
  "Xuping",
  "Magold",
  "Folleado",
  "Acero",
  "Titanio",
  "Artesanal",
  "Cuero sintético",
];
const validAccessoryTypes: MasculineAccessoryType[] = [
  "Cadenas",
  "Pulseras",
  "Anillos",
  "Billeteras",
];
const legacyCategoryMap: Record<string, ProductCategory> = {
  "Aritos & Argollas": "Aritos",
  "Collares & Dijes": "Collares",
  "Anillos & Pulseras": "Anillos",
  "Piercings & Titanio": "Piercings",
  "Conjuntos & Relojes": "Conjuntos",
  "Bolsos & Marroquinería": "Carteras",
  "Carteras & Billeteras": "Carteras",
};

function isProductCategory(value: unknown): value is ProductCategory {
  return categories.slice(1).some((category) => category === value);
}

function isProductMaterial(value: unknown): value is ProductMaterial {
  return validMaterials.some((material) => material === value);
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const product = value as Record<string, unknown>;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    isProductCategory(product.category) &&
    isProductMaterial(product.material) &&
    (product.subcategory === undefined ||
      (product.category === "Dijes" &&
        product.subcategory === "Iniciales")) &&
    (product.accessoryType === undefined ||
      validAccessoryTypes.some((type) => type === product.accessoryType)) &&
    (product.closureType === undefined ||
      product.closureType === "Mariposa" ||
      product.closureType === "Tapa Plana" ||
      product.closureType === "Argolla") &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    typeof product.image === "string" &&
    typeof product.description === "string" &&
    typeof product.inStock === "boolean"
  );
}

export function readProducts(): Product[] {
  if (typeof window === "undefined") {
    return products;
  }

  const storedProducts = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (storedProducts === null) {
    return products;
  }

  let parsedProducts: unknown;
  try {
    parsedProducts = JSON.parse(storedProducts);
  } catch {
    throw new Error(
      "Los productos guardados localmente no tienen un formato válido. Borra los datos locales del catálogo para restaurar la muestra.",
    );
  }

  if (!Array.isArray(parsedProducts)) {
    throw new Error(
      "Los productos guardados localmente contienen datos inválidos. Borra los datos locales del catálogo para restaurar la muestra.",
    );
  }

  const migratedProducts = parsedProducts.map((value): unknown => {
    if (typeof value !== "object" || value === null) {
      return value;
    }

    const product = value as Record<string, unknown>;
    const category =
      typeof product.category === "string"
        ? (legacyCategoryMap[product.category] ?? product.category)
        : product.category;

    return { ...product, category };
  });

  if (!migratedProducts.every(isProduct)) {
    throw new Error(
      "Los productos guardados localmente contienen datos inválidos. Borra los datos locales del catálogo para restaurar la muestra.",
    );
  }

  return migratedProducts;
}

export function writeProducts(
  nextProducts: Product[],
  options: { dispatchEvent?: boolean } = {},
): void {
  try {
    window.localStorage.setItem(
      PRODUCTS_STORAGE_KEY,
      JSON.stringify(nextProducts),
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new Error(
        "No hay espacio local suficiente. Usa imágenes más pequeñas o elimina productos con fotos cargadas.",
      );
    }

    throw error;
  }

  if (options.dispatchEvent !== false) {
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
  }
}
