"use client";

import {
  ArrowLeft,
  ImagePlus,
  PackagePlus,
  Pencil,
  Search,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  categories,
  categoryMaterialOptions,
  materialLabels,
  products as initialProducts,
  type ClosureType,
  type Product,
  type ProductCategory,
} from "@/lib/products";
import {
  PRODUCTS_UPDATED_EVENT,
  readProducts,
  writeProducts,
} from "@/lib/product-storage";

const productCategories = categories.filter(
  (category): category is ProductCategory => category !== "Todos",
);
const closureTypes: ClosureType[] = ["Mariposa", "Tapa Plana", "Argolla"];
const maxImageSize = 512 * 1024;

type ProductDraft = Omit<Product, "id">;

function createEmptyDraft(): ProductDraft {
  return {
    name: "",
    category: "Aritos",
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
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refreshProducts = () => {
      try {
        setItems(readProducts());
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los productos guardados.",
        );
      }
      setIsReady(true);
    };

    refreshProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
    window.addEventListener("storage", refreshProducts);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
      window.removeEventListener("storage", refreshProducts);
    };
  }, []);

  const availableMaterials = categoryMaterialOptions[draft.category];
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
      material: nextMaterials.includes(current.material)
        ? current.material
        : nextMaterials[0],
      closureType:
        category === "Aritos" || category === "Argollas"
          ? current.closureType
          : undefined,
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      event.target.value = "";
      return;
    }
    if (file.size > maxImageSize) {
      setError("La imagen debe pesar 512 KB o menos para guardarse localmente.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("No se pudo generar la vista previa de la imagen.");
        return;
      }
      const image = reader.result;
      setDraft((current) => ({ ...current, image }));
    };
    reader.onerror = () => {
      setError("No se pudo leer la imagen seleccionada.");
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setDraft(createEmptyDraft());
    setEditingId(null);
    setNotice("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!draft.image) {
      setError("Agrega una imagen para el producto.");
      return;
    }

    const product: Product = {
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      ...((draft.category === "Aritos" || draft.category === "Argollas") &&
      draft.closureType
        ? { closureType: draft.closureType }
        : { closureType: undefined }),
    };
    const nextItems = editingId
      ? items.map((item) => (item.id === editingId ? product : item))
      : [product, ...items];

    try {
      writeProducts(nextItems);
      setItems(nextItems);
      resetForm();
      setNotice(editingId ? "Producto actualizado." : "Producto agregado.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el producto.",
      );
    }
  }

  function startEditing(product: Product) {
    const { id, ...productDraft } = product;
    setEditingId(id);
    setDraft(productDraft);
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteProduct(product: Product) {
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo local?`)) {
      return;
    }

    const nextItems = items.filter((item) => item.id !== product.id);
    try {
      writeProducts(nextItems);
      setItems(nextItems);
      if (editingId === product.id) resetForm();
      setNotice("Producto eliminado.");
      setError("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo eliminar el producto.",
      );
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
          <div className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-medium text-warmBrown">
            Prototipo local
          </div>
        </header>

        <aside className="mb-8 rounded-2xl border border-gold/30 bg-white/80 p-4 text-sm leading-6 text-darkBrown/75">
          <strong className="text-darkBrown">Importante:</strong> este panel es
          una maqueta sin autenticación. Los cambios y las imágenes se guardan
          solamente en este navegador y dispositivo. No ingreses información
          sensible; conecta Supabase y habilita autenticación antes de publicar
          esta ruta.
        </aside>

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
                  maxLength={100}
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
                  htmlFor="product-image"
                >
                  Foto del producto{" "}
                  <span className="font-normal text-darkBrown/50">
                    (máximo 512 KB)
                  </span>
                </label>
                <label
                  htmlFor="product-image"
                  className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-darkBrown/25 bg-cream px-4 py-4 text-sm text-warmBrown transition-colors hover:border-gold"
                >
                  <ImagePlus size={18} />
                  Elegir imagen del dispositivo
                </label>
                <input
                  ref={imageInputRef}
                  id="product-image"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {draft.image && (
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-20 w-16 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url('${draft.image}')` }}
                      role="img"
                      aria-label={`Vista previa: ${draft.name || "producto"}`}
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
                  disabled={!isReady}
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
                  Catálogo local
                </p>
                <h2 className="mt-2 font-serif text-2xl">Joyas y accesorios</h2>
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
                Cargando productos guardados…
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
                    <div
                      className="h-16 w-14 shrink-0 rounded-lg bg-[#FDF8F5] bg-cover bg-center"
                      style={{ backgroundImage: `url('${product.image}')` }}
                      role="img"
                      aria-label={product.name}
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
