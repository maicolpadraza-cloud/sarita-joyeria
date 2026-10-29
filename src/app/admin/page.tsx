"use client";

import {
  ArrowLeft,
  LogOut,
  PackagePlus,
  Pencil,
  Search,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { upload as uploadToImageKit } from "@imagekit/next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import ProductImage from "@/components/ProductImage";
import {
  categories,
  categoryMaterialOptions,
  materialLabels,
  type ClosureType,
  type AdminProduct,
  type MasculineAccessoryType,
  type Product,
  type ProductCategory,
  type ProductMaterial,
  type ProductSubcategory,
} from "@/lib/products";
import { prepareProductImage } from "@/lib/prepare-product-image";
import { isAllowedProductImageUrl } from "@/lib/product-validation";
import {
  PRODUCTS_UPDATED_EVENT,
  readProducts,
  writeProducts,
} from "@/lib/product-storage";
import {
  fetchProducts,
  deletePendingImageKitFile,
  ProductsApiError,
  removeProduct as removeProductApi,
  saveProduct,
  updateProductApi,
} from "@/lib/products-api";

const productCategories = categories.filter(
  (category): category is ProductCategory => category !== "Todos",
);
const closureTypes: ClosureType[] = ["Mariposa", "Tapa Plana", "Argolla"];
const masculineAccessoryTypes: MasculineAccessoryType[] = [
  "Cadenas",
  "Pulseras",
  "Anillos",
  "Billeteras",
];
type ProductDraft = Omit<AdminProduct, "id">;

interface ImageKitStorageUsage {
  usedBytes: number;
  limitBytes: number;
}

async function fetchImageKitStorageUsage(): Promise<ImageKitStorageUsage> {
  const response = await fetch("/api/imagekit/usage", {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "No se pudo consultar el espacio de imágenes.";
    throw new Error(message);
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("usedBytes" in payload) ||
    !("limitBytes" in payload) ||
    typeof payload.usedBytes !== "number" ||
    typeof payload.limitBytes !== "number"
  ) {
    throw new Error("La API devolvió un espacio de imágenes inválido.");
  }
  return { usedBytes: payload.usedBytes, limitBytes: payload.limitBytes };
}

function formatStorageSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function createEmptyDraft(): ProductDraft {
  return {
    name: "",
    category: "Aritos",
    subcategory: undefined,
    material: "Xuping",
    closureType: undefined,
    price: 0,
    image: "",
    description: "",
    inStock: true,
  };
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-darkBrown/15 bg-white px-4 py-3 text-sm text-darkBrown outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20";

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [preparedImageSize, setPreparedImageSize] = useState<number | null>(
    null,
  );
  const [imageKitUsage, setImageKitUsage] =
    useState<ImageKitStorageUsage | null>(null);
  const [imageKitUsageError, setImageKitUsageError] = useState("");
  const ignoreNextProductUpdateEvent = useRef(false);
  const pendingImageKitFileId = useRef<string | null>(null);
  const previewObjectUrl = useRef<string | null>(null);

  async function refreshImageKitUsage() {
    try {
      const usage = await fetchImageKitStorageUsage();
      setImageKitUsage(usage);
      setImageKitUsageError("");
    } catch (usageError) {
      setImageKitUsageError(
        usageError instanceof Error
          ? usageError.message
          : "No se pudo consultar el espacio de imágenes.",
      );
    }
  }

  async function handleLogout() {
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("No se pudo cerrar sesión. Inténtalo de nuevo.");
      }
      router.replace("/admin/login");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "No se pudo cerrar sesión. Inténtalo de nuevo.",
      );
    }
  }

  useEffect(() => {
    let isMounted = true;
    let requestVersion = 0;

    const refreshProducts = async (event?: Event) => {
      if (
        event?.type === PRODUCTS_UPDATED_EVENT &&
        ignoreNextProductUpdateEvent.current
      ) {
        ignoreNextProductUpdateEvent.current = false;
        return;
      }

      const currentRequest = ++requestVersion;

      try {
        const remoteProducts = await fetchProducts();
        if (!isMounted || currentRequest !== requestVersion) return;

        setItems(remoteProducts);
        setError("");
      } catch (apiError) {
        if (!isMounted || currentRequest !== requestVersion) return;

        const apiMessage =
          apiError instanceof Error
            ? apiError.message
            : "No se pudo consultar el catálogo en MySQL.";
        if (process.env.NODE_ENV === "development") {
          try {
            setItems(readProducts());
            setError(
              `${apiMessage} Se muestran los productos guardados localmente (solo desarrollo).`,
            );
          } catch (storageError) {
            const storageMessage =
              storageError instanceof Error
                ? storageError.message
                : "No se pudieron cargar los productos guardados.";
            setItems([]);
            setError(`${apiMessage} ${storageMessage}`);
          }
        } else {
          setItems([]);
          setError(`${apiMessage} Inténtalo de nuevo más tarde.`);
        }
      } finally {
        if (isMounted && currentRequest === requestVersion) {
          setIsReady(true);
        }
      }
    };

    refreshProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
    window.addEventListener("storage", refreshProducts);

    return () => {
      isMounted = false;
      requestVersion++;
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
      window.removeEventListener("storage", refreshProducts);
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchImageKitStorageUsage()
      .then((usage) => {
        if (active) setImageKitUsage(usage);
      })
      .catch((usageError: unknown) => {
        if (!active) return;
        setImageKitUsageError(
          usageError instanceof Error
            ? usageError.message
            : "No se pudo consultar el espacio de imágenes.",
        );
      });

    return () => {
      active = false;
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
      }
    };
  }, []);

  async function refreshProductsAfterWrite(
    fallbackProducts: Product[],
  ): Promise<string | null> {
    let warning: string | null = null;

    try {
      const remoteProducts = await fetchProducts();
      setItems(remoteProducts);
      if (process.env.NODE_ENV === "development") {
        try {
          writeProducts(remoteProducts, { dispatchEvent: false });
        } catch (storageError) {
          const message =
            storageError instanceof Error
              ? storageError.message
              : "No se pudo actualizar el respaldo local.";
          warning = `El cambio se guardó en MySQL, pero no se pudo actualizar el respaldo de este dispositivo: ${message}`;
        }
      }
    } catch (apiError) {
      const message =
        apiError instanceof Error
          ? apiError.message
          : "No se pudo refrescar la lista de productos.";
      if (process.env.NODE_ENV === "development") {
        setItems(fallbackProducts);
        try {
          writeProducts(fallbackProducts, { dispatchEvent: false });
          warning = `El cambio se guardó en MySQL, pero no se pudo refrescar la lista desde la API (${message}). Se conserva una copia local como respaldo de desarrollo.`;
        } catch (storageError) {
          const storageMessage =
            storageError instanceof Error
              ? storageError.message
              : "No se pudo actualizar el respaldo local.";
          warning = `El cambio se guardó en MySQL, pero no se pudo refrescar la lista (${message}) ni el respaldo local: ${storageMessage}`;
        }
      } else {
        setItems([]);
        warning = `El cambio se guardó en MySQL, pero no se pudo refrescar la lista desde la API: ${message}`;
      }
    }

    ignoreNextProductUpdateEvent.current = true;
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
    return warning;
  }

  function isDefinitiveApiRejection(error: unknown): boolean {
    return (
      error instanceof ProductsApiError &&
      error.status !== undefined &&
      error.status >= 400 &&
      error.status < 500
    );
  }

  const availableMaterials =
    draft.category === "Dijes" && draft.subcategory === "Iniciales"
      ? (["Xuping", "Acero"] satisfies ProductMaterial[])
      : categoryMaterialOptions[draft.category];
  const searchTerms = searchQuery
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const filteredItems = items.filter((product) => {
    const searchableText = [
      product.name,
      product.category,
      product.material,
      materialLabels[product.material],
      product.description,
      product.closureType,
    ]
      .filter(Boolean)
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

    return searchTerms.every((term) => searchableText.includes(term));
  });

  function updateCategory(category: ProductCategory) {
    const nextMaterials = categoryMaterialOptions[category];
    setDraft((current) => ({
      ...current,
      category,
      subcategory: category === "Dijes" ? current.subcategory : undefined,
      accessoryType:
        category === "Varones"
          ? current.accessoryType ?? "Cadenas"
          : undefined,
      material: nextMaterials.includes(current.material)
        ? current.material
        : nextMaterials[0],
      closureType:
        category === "Aritos" || category === "Argollas"
          ? current.closureType
          : undefined,
    }));
  }

  function resetForm() {
    const pendingFileId = pendingImageKitFileId.current;
    pendingImageKitFileId.current = null;
    if (pendingFileId) {
      deletePendingImageKitFile(pendingFileId).catch((cleanupError: unknown) => {
        setError(
          cleanupError instanceof Error
            ? `No se pudo limpiar la foto pendiente de ImageKit: ${cleanupError.message}`
            : "No se pudo limpiar la foto pendiente de ImageKit.",
        );
      });
    }
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
    setImagePreviewUrl("");
    setPreparedImageSize(null);
    setDraft(createEmptyDraft());
    setEditingId(null);
    setNotice("");
  }

  async function handleImageFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const previousImage = draft.image;
    const previousFileId = draft.imageKitFileId;
    const previousPendingFileId = pendingImageKitFileId.current;
    const previousPreviewUrl = imagePreviewUrl;
    const previousPreparedImageSize = preparedImageSize;
    setError("");
    setNotice("");
    setIsUploadingImage(true);

    try {
      const preparedImage = await prepareProductImage(file);
      const localPreview = URL.createObjectURL(preparedImage);
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
      }
      previewObjectUrl.current = localPreview;
      setImagePreviewUrl(localPreview);
      setPreparedImageSize(preparedImage.size);
      setDraft((current) => ({
        ...current,
        image: "",
        imageKitFileId: undefined,
      }));

      const authResponse = await fetch("/api/imagekit/auth", {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      const authPayload: unknown = await authResponse.json();
      if (
        !authResponse.ok ||
        typeof authPayload !== "object" ||
        authPayload === null ||
        !("token" in authPayload) ||
        !("signature" in authPayload) ||
        !("expire" in authPayload) ||
        !("publicKey" in authPayload) ||
        typeof authPayload.token !== "string" ||
        typeof authPayload.signature !== "string" ||
        typeof authPayload.expire !== "number" ||
        typeof authPayload.publicKey !== "string"
      ) {
        const message =
          typeof authPayload === "object" &&
          authPayload !== null &&
          "error" in authPayload &&
          typeof authPayload.error === "string"
            ? authPayload.error
            : "No se pudo preparar la carga segura de la foto.";
        throw new Error(message);
      }

      const extension =
        preparedImage.type === "image/webp" ? ".webp" : ".jpg";
      const uploadedImage = await uploadToImageKit({
        file: preparedImage,
        fileName: `${crypto.randomUUID()}${extension}`,
        folder: "/sarita/productos",
        useUniqueFileName: false,
        token: authPayload.token,
        signature: authPayload.signature,
        expire: authPayload.expire,
        publicKey: authPayload.publicKey,
      });
      if (!uploadedImage.fileId || !uploadedImage.url) {
        throw new Error("ImageKit no confirmó la carga de la foto.");
      }

      pendingImageKitFileId.current = uploadedImage.fileId;
      if (
        previousPendingFileId &&
        previousPendingFileId !== uploadedImage.fileId
      ) {
        try {
          await deletePendingImageKitFile(previousPendingFileId);
        } catch (cleanupError) {
          setError(
            cleanupError instanceof Error
              ? `La nueva foto se subió, pero no se pudo limpiar la foto pendiente anterior: ${cleanupError.message}`
              : "La nueva foto se subió, pero no se pudo limpiar la foto pendiente anterior.",
          );
        }
      }
      setDraft((current) => ({
        ...current,
        image: uploadedImage.url!,
        imageKitFileId: uploadedImage.fileId!,
      }));
      setImagePreviewUrl(uploadedImage.url);
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
        previewObjectUrl.current = null;
      }
      await refreshImageKitUsage();
    } catch (uploadError) {
      setDraft((current) => ({
        ...current,
        image: previousImage,
        imageKitFileId: previousFileId,
      }));
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
        previewObjectUrl.current = null;
      }
      setImagePreviewUrl(previousPreviewUrl);
      setPreparedImageSize(previousPreparedImageSize);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo procesar ni subir la foto.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!draft.image) {
      setError("Agrega una imagen para el producto.");
      return;
    }

    const product: AdminProduct = {
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      ...(draft.category === "Dijes" && draft.subcategory === "Iniciales"
        ? { subcategory: draft.subcategory }
        : { subcategory: undefined }),
      ...((draft.category === "Aritos" || draft.category === "Argollas") &&
      draft.closureType
        ? { closureType: draft.closureType }
        : { closureType: undefined }),
    };
    const isEditing = editingId !== null;
    const nextItems = isEditing
      ? items.map((item) => (item.id === editingId ? product : item))
      : [product, ...items];

    try {
      const writeResult = editingId
        ? await updateProductApi(editingId, product)
        : await saveProduct(product);
      pendingImageKitFileId.current = null;
      const syncWarning = await refreshProductsAfterWrite(nextItems);
      resetForm();
      await refreshImageKitUsage();
      if (writeResult.warning || syncWarning) {
        setError(writeResult.warning ?? syncWarning ?? "");
      } else {
        setNotice(isEditing ? "Producto actualizado." : "Producto agregado.");
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el producto.";
      if (isDefinitiveApiRejection(saveError)) {
        setError(`La API rechazó la operación: ${message}`);
        return;
      }

      if (process.env.NODE_ENV !== "development") {
        setError(`MySQL no pudo guardar el producto: ${message}`);
        return;
      }

      try {
        ignoreNextProductUpdateEvent.current = true;
        writeProducts(nextItems);
        setItems(nextItems);
        resetForm();
        setError(
          `MySQL no pudo guardar el producto (${message}). Se conservó solamente en el respaldo local de este dispositivo.`,
        );
      } catch (storageError) {
        ignoreNextProductUpdateEvent.current = false;
        const storageMessage =
          storageError instanceof Error
            ? storageError.message
            : "No se pudo guardar el respaldo local.";
        setError(
          `MySQL no pudo guardar el producto (${message}) y tampoco se pudo guardar el respaldo local: ${storageMessage}`,
        );
      }
    }
  }

  function startEditing(product: AdminProduct) {
    if (pendingImageKitFileId.current) resetForm();
    const { id, ...productDraft } = product;
    setEditingId(id);
    setDraft(productDraft);
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(product: AdminProduct) {
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo?`)) {
      return;
    }

    const nextItems = items.filter((item) => item.id !== product.id);
    try {
      const deleteWarning = await removeProductApi(product.id);
      const syncWarning = await refreshProductsAfterWrite(nextItems);
      if (editingId === product.id) resetForm();
      if (deleteWarning || syncWarning) {
        setError(deleteWarning ?? syncWarning ?? "");
      } else {
        setNotice("Producto eliminado.");
        setError("");
      }
      await refreshImageKitUsage();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo eliminar el producto.";
      if (isDefinitiveApiRejection(saveError)) {
        setError(`La API rechazó la operación: ${message}`);
        return;
      }

      if (process.env.NODE_ENV !== "development") {
        setError(`MySQL no pudo eliminar el producto: ${message}`);
        return;
      }

      try {
        ignoreNextProductUpdateEvent.current = true;
        writeProducts(nextItems);
        setItems(nextItems);
        if (editingId === product.id) resetForm();
        setError(
          `MySQL no pudo eliminar el producto (${message}). La eliminación se aplicó solamente al respaldo local de este dispositivo.`,
        );
      } catch (storageError) {
        ignoreNextProductUpdateEvent.current = false;
        const storageMessage =
          storageError instanceof Error
            ? storageError.message
            : "No se pudo actualizar el respaldo local.";
        setError(
          `MySQL no pudo eliminar el producto (${message}) y tampoco se pudo actualizar el respaldo local: ${storageMessage}`,
        );
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f1ed] px-4 py-6 text-darkBrown sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-xs text-warmBrown transition-colors hover:text-darkBrown"
            >
              <ArrowLeft size={15} /> Volver a la tienda
            </Link>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-warmBrown">
              Sarita Joyería y Accesorios
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
              Administración de productos
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-medium text-warmBrown">
              MySQL · panel protegido
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-darkBrown/15 bg-white px-4 py-2 text-sm font-medium text-darkBrown transition-colors hover:bg-darkBrown/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <LogOut size={16} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </header>

        {error && (
          <p
            className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
            role="status"
          >
            {notice}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="h-fit rounded-2xl border border-darkBrown/10 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose/55 text-warmBrown">
                {editingId ? <Pencil size={18} /> : <PackagePlus size={18} />}
              </span>
              <div>
                <h2 className="font-serif text-2xl">
                  {editingId ? "Editar producto" : "Agregar producto"}
                </h2>
                <p className="mt-1 text-xs text-darkBrown/55">
                  Los precios se registran en bolivianos (Bs.).
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs font-medium">
                Nombre del producto
                <input
                  className={inputClassName}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  maxLength={150}
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium">
                  Categoría
                  <select
                    className={inputClassName}
                    value={draft.category}
                    onChange={(event) => {
                      const category = productCategories.find(
                        (item) => item === event.target.value,
                      );
                      if (category) updateCategory(category);
                    }}
                  >
                    {productCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-medium">
                  Material
                  <select
                    className={inputClassName}
                    value={draft.material}
                    onChange={(event) => {
                      const material = availableMaterials.find(
                        (item) => item === event.target.value,
                      );
                      if (material) setDraft({ ...draft, material });
                    }}
                  >
                    {availableMaterials.map((material) => (
                      <option key={material} value={material}>
                        {materialLabels[material]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {draft.category === "Dijes" && (
                <label className="block text-xs font-medium">
                  Subcategoría
                  <select
                    className={inputClassName}
                    value={draft.subcategory ?? ""}
                    onChange={(event) => {
                      const subcategory: ProductSubcategory | undefined =
                        event.target.value === "Iniciales"
                          ? "Iniciales"
                          : undefined;
                      setDraft({
                        ...draft,
                        subcategory,
                        material:
                          subcategory === "Iniciales" &&
                          draft.material !== "Xuping" &&
                          draft.material !== "Acero"
                            ? "Xuping"
                            : draft.material,
                      });
                    }}
                  >
                    <option value="">Todos los dijes</option>
                    <option value="Iniciales">Iniciales</option>
                  </select>
                </label>
              )}

              {draft.category === "Varones" && (
                <label className="block text-xs font-medium">
                  Tipo de accesorio
                  <select
                    className={inputClassName}
                    value={draft.accessoryType ?? ""}
                    onChange={(event) => {
                      const accessoryType = masculineAccessoryTypes.find(
                        (item) => item === event.target.value,
                      );
                      if (accessoryType) setDraft({ ...draft, accessoryType });
                    }}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un tipo
                    </option>
                    {masculineAccessoryTypes.map((accessoryType) => (
                      <option key={accessoryType} value={accessoryType}>
                        {accessoryType}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(draft.category === "Aritos" ||
                draft.category === "Argollas") && (
                <label className="block text-xs font-medium">
                  Tipo de cierre
                  <select
                    className={inputClassName}
                    value={draft.closureType ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        closureType: closureTypes.find(
                          (closure) => closure === event.target.value,
                        ),
                      })
                    }
                  >
                    <option value="">Sin especificar</option>
                    {closureTypes.map((closure) => (
                      <option key={closure} value={closure}>
                        {closure}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-xs font-medium">
                Precio en Bs.
                <input
                  className={inputClassName}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.price || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      price: Number(event.target.value),
                    })
                  }
                  required
                />
              </label>

              <label className="block text-xs font-medium">
                Descripción
                <textarea
                  className={`${inputClassName} min-h-20 resize-y`}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  maxLength={300}
                  rows={3}
                />
              </label>

              <div>
                <label
                  className="block text-xs font-medium"
                  htmlFor="product-image-file"
                >
                  Foto del producto
                </label>
                <input
                  id="product-image-file"
                  className={inputClassName}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={handleImageFileChange}
                  disabled={isUploadingImage}
                />
                <p className="mt-2 text-xs leading-5 text-darkBrown/55">
                  JPEG, PNG, WebP o HEIC; máximo 15 MB. Se optimiza y se sube a
                  ImageKit desde este dispositivo.
                </p>
                {isUploadingImage && (
                  <p className="mt-2 text-xs font-medium text-warmBrown" role="status">
                    Preparando y subiendo la foto…
                  </p>
                )}
                {preparedImageSize !== null && (
                  <p className="mt-2 text-xs text-darkBrown/60">
                    Peso optimizado: {formatStorageSize(preparedImageSize)}
                  </p>
                )}

                <label
                  className="mt-4 block text-xs font-medium"
                  htmlFor="product-image"
                >
                  O usa una URL permitida
                </label>
                <input
                  id="product-image"
                  className={inputClassName}
                  type="text"
                  inputMode="url"
                  value={draft.image}
                  onChange={(event) => {
                    const pendingFileId = pendingImageKitFileId.current;
                    pendingImageKitFileId.current = null;
                    if (pendingFileId) {
                      deletePendingImageKitFile(pendingFileId).catch(
                        (cleanupError: unknown) => {
                          setError(
                            cleanupError instanceof Error
                              ? `No se pudo limpiar la foto pendiente de ImageKit: ${cleanupError.message}`
                              : "No se pudo limpiar la foto pendiente de ImageKit.",
                          );
                        },
                      );
                    }
                    if (previewObjectUrl.current) {
                      URL.revokeObjectURL(previewObjectUrl.current);
                      previewObjectUrl.current = null;
                    }
                    setImagePreviewUrl("");
                    setPreparedImageSize(null);
                    setDraft({
                      ...draft,
                      image: event.target.value,
                      imageKitFileId: undefined,
                    });
                  }}
                  maxLength={2048}
                  placeholder="https://images.unsplash.com/… o /images/joya.jpg"
                  required
                />
                <p className="mt-2 text-xs leading-5 text-darkBrown/55">
                  Se aceptan rutas del sitio, images.unsplash.com o tu endpoint
                  de ImageKit.
                </p>
                {(imagePreviewUrl || isAllowedProductImageUrl(draft.image)) && (
                  <div className="mt-3 flex items-center gap-3">
                    <ProductImage
                      src={imagePreviewUrl || draft.image}
                      alt={`Vista previa: ${draft.name || "producto"}`}
                      width={64}
                      height={80}
                      className="h-20 w-16 rounded-lg object-cover"
                    />
                    <span className="text-xs text-darkBrown/60">
                      Vista previa seleccionada
                    </span>
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.inStock}
                  onChange={(event) =>
                    setDraft({ ...draft, inStock: event.target.checked })
                  }
                  className="h-4 w-4 accent-[#8C6B58]"
                />
                Disponible en stock
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-darkBrown px-5 py-3 text-sm text-cream transition-colors hover:bg-warmBrown disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={!isReady || isUploadingImage}
                >
                  {editingId ? <Save size={16} /> : <PackagePlus size={16} />}
                  {editingId ? "Guardar cambios" : "Agregar al catálogo"}
                </button>
                {editingId && (
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-darkBrown/15 px-4 py-3 text-sm transition-colors hover:bg-cream"
                    type="button"
                    onClick={resetForm}
                  >
                    <X size={16} /> Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-darkBrown/10 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-warmBrown">
                  Catálogo
                </p>
                <h2 className="mt-2 font-serif text-2xl">Joyas y accesorios</h2>
                <p className="mt-2 text-xs text-darkBrown/60" aria-live="polite">
                  {imageKitUsage
                    ? `ImageKit · ${formatStorageSize(imageKitUsage.usedBytes)} de ${formatStorageSize(imageKitUsage.limitBytes)} aprox. en /sarita/productos`
                    : imageKitUsageError || "Consultando espacio de imágenes…"}
                </p>
                {imageKitUsage &&
                  imageKitUsage.usedBytes / imageKitUsage.limitBytes >= 0.7 && (
                    <p className="mt-1 text-xs font-semibold text-amber-800" role="status">
                      Advertencia: se superó el 70 % del espacio estimado de 5 GB.
                    </p>
                  )}
              </div>
              <span className="text-xs text-darkBrown/55">
                {searchTerms.length > 0
                  ? `${filteredItems.length} de ${items.length}`
                  : items.length}{" "}
                {items.length === 1 ? "producto" : "productos"}
              </span>
            </div>

            <label className="mb-5 flex items-center gap-3 rounded-xl border border-darkBrown/15 bg-cream px-4 transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
              <Search
                size={18}
                className="shrink-0 text-warmBrown"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, categoría o material…"
                aria-label="Buscar productos del catálogo"
                className="w-full bg-transparent py-3 text-sm text-darkBrown outline-none placeholder:text-darkBrown/45"
              />
            </label>

            {!isReady ? (
              <p className="py-8 text-center text-sm text-darkBrown/55">
                Cargando productos…
              </p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center font-serif text-lg text-darkBrown/55">
                El catálogo está vacío. Agrega el primer producto.
              </p>
            ) : filteredItems.length === 0 ? (
              <p className="py-8 text-center font-serif text-lg text-darkBrown/55">
                No hay productos que coincidan con “{searchQuery}”.
              </p>
            ) : (
              <ul className="divide-y divide-darkBrown/10">
                {filteredItems.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 py-4 first:pt-0"
                  >
                    <ProductImage
                      src={
                        isAllowedProductImageUrl(product.image)
                          ? product.image
                          : "/logo-luna.png"
                      }
                      alt={product.name}
                      width={56}
                      height={64}
                      className="h-16 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-warmBrown">
                        {product.category} · {materialLabels[product.material]}
                      </p>
                      <p className="mt-1 text-xs">
                        Bs. {product.price.toFixed(2)} ·{" "}
                        {product.inStock ? "En stock" : "Agotado"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label={`Editar ${product.name}`}
                        onClick={() => startEditing(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-warmBrown transition-colors hover:bg-rose/50"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar ${product.name}`}
                        onClick={() => deleteProduct(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
