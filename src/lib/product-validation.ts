import {
  categories,
  materialLabels,
  type ClosureType,
  type MasculineAccessoryType,
  type Product,
  type ProductCategory,
  type ProductMaterial,
  type ProductSubcategory,
} from "@/lib/products";

export type ProductInput = Omit<Product, "id"> & { id?: string };

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

const validMaterials = Object.keys(materialLabels);
const validAccessoryTypes: MasculineAccessoryType[] = [
  "Cadenas",
  "Pulseras",
  "Anillos",
  "Billeteras",
];
const validClosureTypes: ClosureType[] = [
  "Mariposa",
  "Tapa Plana",
  "Argolla",
];
const maxImageLength = 700 * 1024;

export function isProductCategory(value: unknown): value is ProductCategory {
  return categories.slice(1).some((category) => category === value);
}

export function isProductMaterial(value: unknown): value is ProductMaterial {
  return validMaterials.some((material) => material === value);
}

export function isProductSubcategory(
  value: unknown,
  category: unknown,
): value is ProductSubcategory {
  return category === "Dijes" && value === "Iniciales";
}

export function isMasculineAccessoryType(
  value: unknown,
): value is MasculineAccessoryType {
  return validAccessoryTypes.some((type) => type === value);
}

export function isClosureType(value: unknown): value is ClosureType {
  return validClosureTypes.some((type) => type === value);
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
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ProductValidationError("El cuerpo del producto debe ser un objeto.");
  }

  const input = value as Record<string, unknown>;
  const id = input.id;
  const name = input.name;
  const category = input.category;
  const material = input.material;
  const subcategory = input.subcategory;
  const accessoryType = input.accessoryType;
  const closureType = input.closureType;
  const price = input.price;
  const image = input.image;
  const description = input.description;
  const inStock = input.inStock;

  if (
    options.requireId &&
    (typeof id !== "string" || id.trim().length === 0 || id.length > 64)
  ) {
    throw new ProductValidationError(
      "El identificador debe ser un texto de hasta 64 caracteres.",
    );
  }
  if (
    id !== undefined &&
    (typeof id !== "string" || id.trim().length === 0 || id.length > 64)
  ) {
    throw new ProductValidationError(
      "El identificador debe ser un texto de hasta 64 caracteres.",
    );
  }
  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.length > 150
  ) {
    throw new ProductValidationError(
      "El nombre es obligatorio y no puede superar los 150 caracteres.",
    );
  }
  if (!isProductCategory(category)) {
    throw new ProductValidationError("La categoría seleccionada no es válida.");
  }
  if (!isProductMaterial(material)) {
    throw new ProductValidationError("El material seleccionado no es válido.");
  }
  if (
    subcategory !== undefined &&
    !isProductSubcategory(subcategory, category)
  ) {
    throw new ProductValidationError("La subcategoría seleccionada no es válida.");
  }
  if (
    accessoryType !== undefined &&
    !isMasculineAccessoryType(accessoryType)
  ) {
    throw new ProductValidationError(
      "El tipo de accesorio seleccionado no es válido.",
    );
  }
  if (closureType !== undefined && !isClosureType(closureType)) {
    throw new ProductValidationError("El tipo de cierre seleccionado no es válido.");
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    throw new ProductValidationError(
      "El precio debe ser un número mayor o igual a cero.",
    );
  }
  if (typeof image !== "string" || image.length > maxImageLength) {
    throw new ProductValidationError(
      "La imagen debe ser un texto válido y no superar aproximadamente 700 KB.",
    );
  }
  if (typeof description !== "string") {
    throw new ProductValidationError("La descripción debe ser un texto.");
  }
  if (typeof inStock !== "boolean") {
    throw new ProductValidationError(
      "El estado de disponibilidad debe ser verdadero o falso.",
    );
  }

  const product: ProductInput = {
    name,
    category,
    material,
    price,
    image,
    description,
    inStock,
    ...(id === undefined ? {} : { id }),
    ...(subcategory === undefined ? {} : { subcategory }),
    ...(accessoryType === undefined ? {} : { accessoryType }),
    ...(closureType === undefined ? {} : { closureType }),
  };

  if (options.requireId) {
    return { ...product, id: id as string };
  }

  return product;
}
