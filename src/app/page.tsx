"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import {
  categories,
  materialFilters,
  materialLabels,
  materialBadgeLabels,
  materialsByCategory,
  products,
  type MasculineAccessoryType,
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

const masculineAccessoryFilters: {
  label: "Todas" | MasculineAccessoryType;
  value: MasculineAccessoryType | null;
}[] = [
  { label: "Todas", value: null },
  { label: "Cadenas", value: "Cadenas" },
  { label: "Pulseras", value: "Pulseras" },
  { label: "Anillos", value: "Anillos" },
  { label: "Billeteras", value: "Billeteras" },
];

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>("Todos");
  const [selectedMaterial, setSelectedMaterial] =
    useState<ProductMaterial | null>(null);
  const [selectedAccessoryType, setSelectedAccessoryType] =
    useState<MasculineAccessoryType | null>(null);
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
      (selectedCategory !== "Varones" ||
        selectedAccessoryType === null ||
        product.accessoryType === selectedAccessoryType) &&
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
        className="m-0 min-h-screen bg-cream p-0 text-darkBrown"
      >
        <header className="m-0 border-b border-darkBrown/10 bg-[#FAF7F2]">
          <div className="mx-auto flex max-w-7xl justify-center px-5 py-5 sm:px-8">
            <a
              href="#inicio"
              className="text-center font-editorial text-xl font-semibold leading-none tracking-[0.08em] sm:text-2xl"
              aria-label="Sarita Joyería y Accesorios, inicio"
            >
              <svg
                aria-hidden="true"
                className="celestial-isotype mx-auto mb-1 h-8 w-8"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g
                  stroke="#D4AF37"
                  strokeLinecap="round"
                  strokeWidth="1.2"
                >
                  <path d="M13 4.5v3" />
                  <path d="m5.7 8.5 2.1 2.1" />
                  <path d="M3 16h3" />
                  <path d="m5.7 23.5 2.1-2.1" />
                </g>
                <path
                  d="M13 9.5c.9 4.1 2.4 5.6 6.5 6.5-4.1.9-5.6 2.4-6.5 6.5-.9-4.1-2.4-5.6-6.5-6.5 4.1-.9 5.6-2.4 6.5-6.5Z"
                  fill="#D4AF37"
                />
                <path
                  d="M27.1 8.1a12 12 0 1 0 5.8 21.5 10 10 0 0 1-5.8-21.5Z"
                  fill="#D4AF37"
                />
                <path
                  d="m32.5 5 .6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1Z"
                  fill="#D4AF37"
                />
              </svg>
              <span className="block">SARITA</span>
              <span className="mt-1 block font-boutique text-[9px] tracking-[0.28em] text-warmBrown sm:text-[10px]">
                JOYERÍA Y ACCESORIOS
              </span>
            </a>
          </div>
        </header>

        <section
          id="inicio"
          className="relative isolate overflow-hidden bg-[#F8F5EE]"
        >
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(250,247,242,0.98)_0%,rgba(250,247,242,0.94)_30%,rgba(248,245,238,0.72)_55%,rgba(248,245,238,0)_100%)]" />
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
              <p className="mb-5 font-boutique text-[10px] font-medium uppercase tracking-[0.22em] text-[#8C7262] sm:text-xs">
                Pequeños detalles, grandes momentos
              </p>
              <h1 className="font-editorial text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Brilla con
                <br />
                <span className="italic text-[#C5A059]">tu propia luz.</span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-darkBrown/75 sm:text-base">
                Joyas y accesorios elegidos con cariño para acompañarte todos
                los días y celebrar quién eres.
              </p>
              <a
                href="#coleccion"
                className="mt-9 inline-flex items-center border border-[#C5A059] bg-[#221E1B] px-7 py-4 font-boutique text-[10px] font-medium uppercase tracking-[0.15em] text-[#FAF7F2] transition-colors duration-300 hover:bg-[#C5A059] hover:text-[#221E1B]"
              >
                DESCUBRE NUESTRA COLECCIÓN →
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
            <p className="text-xs font-light uppercase tracking-wider text-[#8C6B58]/80">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </p>
          </div>

          <div
            className="scrollbar-none -mx-5 flex scroll-smooth gap-6 overflow-x-auto border-b border-[#2C2623]/10 px-5 pb-3 sm:mx-0 sm:px-0"
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
                  setSelectedAccessoryType(null);
                }}
                className={`shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium tracking-wide transition-colors duration-200 ${
                  selectedCategory === category
                    ? "-mb-[13px] border-[#C5A059] font-semibold text-[#2C2623]"
                    : "border-transparent text-[#8C6B58]/70 hover:text-[#2C2623]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory === "Varones" && (
            <div
              className="mt-4 flex flex-wrap gap-2"
              aria-label="Filtrar accesorios masculinos por tipo"
            >
              {masculineAccessoryFilters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={selectedAccessoryType === filter.value}
                  onClick={() => setSelectedAccessoryType(filter.value)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                    selectedAccessoryType === filter.value
                      ? "border-[#2C2623] bg-[#2C2623] text-[#FDF8F5] shadow-sm"
                      : "border-[#FADCD9]/30 bg-[#FADCD9]/20 text-[#8C6B58] hover:bg-[#FADCD9]/50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          <div
            className="mt-4 mb-8 flex flex-wrap gap-2"
            aria-label="Filtrar por material o colección"
          >
            {visibleMaterialFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                aria-pressed={selectedMaterial === filter.value}
                onClick={() => setSelectedMaterial(filter.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                  selectedMaterial === filter.value
                    ? "bg-[#2C2623] text-[#FDF8F5] shadow-sm"
                    : "border border-[#FADCD9]/30 bg-[#FADCD9]/20 text-[#8C6B58] hover:bg-[#FADCD9]/50"
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
                  <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-wider text-[#8C6B58] shadow-xs backdrop-blur-md">
                    {materialBadgeLabels[product.material]}
                  </span>
                  {!product.inStock && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1.5 text-[9px] uppercase tracking-wide text-darkBrown/70 backdrop-blur-md">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="px-1 pt-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#8C6B58]">
                    {product.category}
                    {product.accessoryType && ` · ${product.accessoryType}`}
                    {" · "}
                    {materialLabels[product.material]}
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug text-[#2C2623]">
                      {product.name}
                    </h3>
                    <p className="shrink-0 whitespace-nowrap text-base font-semibold text-[#C5A059]">
                      {bolivianCurrency.format(product.price)}
                    </p>
                  </div>
                  {product.closureType && (
                    <p className="mt-1 block text-xs font-normal text-[#8C6B58]/80">
                      Cierre: {product.closureType}
                    </p>
                  )}
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
