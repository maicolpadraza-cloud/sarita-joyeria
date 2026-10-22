"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import {
  categories,
  materialFilters,
  materialLabels,
  materialBadgeLabels,
  materialsByCategory,
  products,
  type Product,
  type ProductMaterial,
} from "@/lib/products";
import {
  PRODUCTS_UPDATED_EVENT,
  readProducts,
} from "@/lib/product-storage";

const bolivianCurrency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>("Todos");
  const [selectedMaterial, setSelectedMaterial] =
    useState<ProductMaterial | null>(null);
  useEffect(() => {
    const refreshProducts = () => {
      try {
        setCatalogProducts(readProducts());
        setCatalogError("");
      } catch (loadError) {
        setCatalogError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los productos guardados.",
        );
      }
    };

    refreshProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
    window.addEventListener("storage", refreshProducts);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
      window.removeEventListener("storage", refreshProducts);
    };
  }, []);
  const visibleMaterialFilters =
    selectedCategory === "Todos"
      ? materialFilters
      : materialFilters.filter(
          (filter) =>
            filter.value === null ||
            materialsByCategory[selectedCategory].includes(filter.value),
        );
  const filteredProducts = catalogProducts.filter(
    (product) =>
      (selectedCategory === "Todos" ||
        product.category === selectedCategory) &&
      (selectedMaterial === null || product.material === selectedMaterial),
  );

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="min-h-screen bg-cream text-darkBrown"
      >
        <div className="bg-darkBrown px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-cream sm:text-xs">
          UN DETALLE ESPECIAL PARA CADA MOMENTO · ENVÍOS A TODA BOLIVIA
        </div>

        <header className="border-b border-darkBrown/10 bg-cream">
          <div className="mx-auto flex max-w-7xl justify-center px-5 py-5 sm:px-8">
            <a
              href="#inicio"
              className="text-center font-serif text-xl leading-none tracking-[0.08em] sm:text-2xl"
              aria-label="Sarita Joyería y Accesorios, inicio"
            >
              SARITA
              <span className="mt-1 block text-[9px] font-sans tracking-[0.28em] text-warmBrown sm:text-[10px]">
                JOYERÍA Y ACCESORIOS
              </span>
            </a>
          </div>
        </header>

        <section
          id="inicio"
          className="relative isolate overflow-hidden bg-[#f4e9e2]"
        >
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(253,248,245,0.96)_0%,rgba(253,248,245,0.84)_45%,rgba(253,248,245,0.08)_100%)]" />
          <div
            className="absolute inset-0 -z-20 bg-cover bg-[center_42%]"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=2000&q=90')",
            }}
            role="img"
            aria-label="Colección de joyería dorada"
          />
          <div className="mx-auto flex min-h-[510px] max-w-7xl items-center px-6 py-20 sm:min-h-[590px] sm:px-10 lg:min-h-[650px]">
            <div className="max-w-xl">
              <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.28em] text-warmBrown sm:text-xs">
                Pequeños detalles, grandes momentos
              </p>
              <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Brilla con
                <br />
                <span className="italic text-warmBrown">tu propia luz.</span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-darkBrown/75 sm:text-base">
                Joyas y accesorios elegidos con cariño para acompañarte todos
                los días y celebrar quién eres.
              </p>
              <a
                href="#coleccion"
                className="mt-9 inline-flex items-center gap-3 bg-darkBrown px-7 py-4 text-[10px] font-medium uppercase tracking-[0.18em] text-cream transition-colors hover:bg-warmBrown"
              >
                Descubre la colección <ArrowRight size={15} />
              </a>
            </div>
          </div>
          <div className="absolute bottom-7 right-7 hidden text-[9px] uppercase tracking-[0.25em] text-darkBrown/60 sm:block">
            Hecho para hacerte brillar
          </div>
        </section>

        <section id="coleccion" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          {catalogError && (
            <p
              className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {catalogError}
            </p>
          )}
          <div className="mb-9 flex flex-col justify-between gap-6 sm:mb-12 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-warmBrown">
                Joyas y accesorios para cada ocasión
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl">Nuestra colección</h2>
            </div>
            <p className="text-xs text-darkBrown/60">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </p>
          </div>

          <div
            className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
            aria-label="Filtrar por categoría"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                onClick={() => {
                  if (
                    selectedMaterial !== null &&
                    category !== "Todos" &&
                    !materialsByCategory[category].includes(selectedMaterial)
                  ) {
                    setSelectedMaterial(null);
                  }
                  setSelectedCategory(category);
                }}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-[11px] transition-colors ${
                selectedCategory === category
                  ? "border-darkBrown bg-darkBrown text-cream"
                  : "border-darkBrown/15 bg-transparent text-darkBrown/70 hover:border-warmBrown hover:text-warmBrown"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div
            className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
            aria-label="Filtrar por material o colección"
          >
            {visibleMaterialFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                aria-pressed={selectedMaterial === filter.value}
                onClick={() => setSelectedMaterial(filter.value)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[10px] transition-colors ${
                selectedMaterial === filter.value
                  ? "bg-rose text-darkBrown"
                  : "bg-darkBrown/[0.04] text-darkBrown/65 hover:bg-rose/60"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div
            id="productos"
            className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4"
          >
            {filteredProducts.map((product) => (
              <article key={product.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#FDF8F5]">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url('${product.image}')` }}
                    role="img"
                    aria-label={product.name}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium tracking-wider text-[#8C6B58] backdrop-blur-md">
                    {materialBadgeLabels[product.material]}
                  </span>
                  {!product.inStock && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1.5 text-[9px] uppercase tracking-wide text-darkBrown/70 backdrop-blur-md">
                      Agotado
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Guardar ${product.name} en favoritos`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-colors hover:bg-white hover:text-warmBrown"
                  >
                    <Heart size={16} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-3 px-1 pt-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6B58]">
                      {product.category} · {materialLabels[product.material]}
                    </p>
                    <h3 className="mt-1 text-sm font-medium text-[#2C2623]">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-[10px] leading-5 text-darkBrown/55">
                      {product.description}
                    </p>
                    {product.closureType && (
                      <p className="mt-1 text-[10px] text-darkBrown/55">
                        Cierre: {product.closureType}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 pt-4 text-base font-semibold text-[#C5A059]">
                    {bolivianCurrency.format(product.price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <p className="py-16 text-center font-serif text-xl text-darkBrown/65">
              No encontramos productos para estos filtros.
            </p>
          )}
        </section>

        <section
          id="nosotros"
          className="bg-rose/55 px-6 py-14 text-center sm:py-20"
        >
          <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-warmBrown">
            Un regalo para ti
          </p>
          <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-snug sm:text-4xl">
            La belleza está en los detalles que hablan de ti.
          </h2>
          <a
            id="contacto"
            href="mailto:hola@saritajoyeria.cl"
            className="mt-7 inline-block border-b border-gold pb-1 text-xs tracking-wide transition-colors hover:text-warmBrown"
          >
            Conoce más sobre Sarita
          </a>
        </section>

        <footer className="bg-darkBrown px-6 py-7 text-center text-[10px] tracking-[0.12em] text-cream/70">
          Sarita Joyería y Accesorios · Hecho con cariño
        </footer>
      </motion.main>
    </>
  );
}
