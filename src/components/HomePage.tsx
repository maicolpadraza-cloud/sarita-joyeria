"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Montserrat, Playfair_Display } from "next/font/google";
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
import { fetchProducts } from "@/lib/products-api";

const playfairDisplay = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

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

export type HomePageFilters = {
  category: (typeof categories)[number];
  material: ProductMaterial | null;
  dijeSubcategory: "Iniciales" | null;
  accessoryType: MasculineAccessoryType | null;
};

type HomePageProps = {
  initialFilters: HomePageFilters;
};

export default function HomePage({ initialFilters }: HomePageProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>(initialFilters.category);
  const [selectedMaterial, setSelectedMaterial] =
    useState<ProductMaterial | null>(initialFilters.material);
  const [selectedDijeSubcategory, setSelectedDijeSubcategory] =
    useState<"Iniciales" | null>(initialFilters.dijeSubcategory);
  const [selectedAccessoryType, setSelectedAccessoryType] =
    useState<MasculineAccessoryType | null>(initialFilters.accessoryType);
  useEffect(() => {
    let isMounted = true;
    let requestVersion = 0;

    const refreshProducts = async () => {
      const currentRequest = ++requestVersion;

      try {
        const remoteProducts = await fetchProducts();
        if (!isMounted || currentRequest !== requestVersion) return;

        setCatalogProducts(remoteProducts);
        setCatalogError("");
      } catch (apiError) {
        if (!isMounted || currentRequest !== requestVersion) return;

        try {
          setCatalogProducts(readProducts());
          const apiMessage =
            apiError instanceof Error
              ? apiError.message
              : "No se pudo conectar con el catálogo.";
          setCatalogError(
            `${apiMessage} Se muestran los productos guardados en este dispositivo.`,
          );
        } catch (storageError) {
          const storageMessage =
            storageError instanceof Error
              ? storageError.message
              : "No se pudieron cargar los productos guardados.";
          setCatalogError(`${storageMessage} No se pudo consultar el catálogo en MySQL.`);
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
  const visibleMaterialFilters =
    selectedCategory === "Todos"
      ? materialFilters
      : materialFilters.filter((filter) => {
          if (filter.value === null) return true;

          const categoryMaterials = materialsByCategory[selectedCategory];
          if (
            selectedCategory === "Dijes" &&
            selectedDijeSubcategory === "Iniciales"
          ) {
            return filter.value === "Xuping" || filter.value === "Acero";
          }
          return categoryMaterials.includes(filter.value);
        });
  const filteredProducts = catalogProducts.filter(
    (product) =>
      (selectedCategory === "Todos" ||
        product.category === selectedCategory) &&
      (selectedCategory !== "Dijes" ||
        selectedDijeSubcategory === null ||
        product.subcategory === selectedDijeSubcategory) &&
      (selectedCategory !== "Varones" ||
        selectedAccessoryType === null ||
        product.accessoryType === selectedAccessoryType) &&
      (selectedMaterial === null || product.material === selectedMaterial),
  );
  const getProductHref = (product: Product) => {
    const params = new URLSearchParams({ category: selectedCategory });
    if (selectedMaterial) params.set("material", selectedMaterial);
    if (selectedDijeSubcategory) {
      params.set("dije", selectedDijeSubcategory);
    }
    if (selectedAccessoryType) {
      params.set("accessory", selectedAccessoryType);
    }

    return `/productos/${encodeURIComponent(product.id)}?${params.toString()}`;
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="m-0 min-h-screen w-full max-w-full overflow-x-hidden bg-cream p-0 text-darkBrown"
      >
        <header className="m-0 border-b border-[#A7794F]/20 bg-[#F1D5D5]">
          <div className="mx-auto flex max-w-7xl justify-center px-4 py-3 sm:px-8">
            <a
              href="#inicio"
              className="flex flex-col items-center text-center"
              aria-label="Sarita Joyería y Accesorios, inicio"
            >
              <Image
                src="/logo-luna.png"
                alt="Logo Luna"
                width={52}
                height={31}
                className="h-auto w-12 object-contain"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(48%) sepia(18%) saturate(780%) hue-rotate(350deg) brightness(88%) contrast(84%)",
                }}
              />
              <span className="flex flex-col items-center">
                <span
                  className={`${playfairDisplay.className} block bg-clip-text text-[22px] leading-tight text-transparent`}
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #A7794F 0%, #B88486 50%, #A7794F 100%)",
                  }}
                >
                  SARITA
                </span>
                <span
                  className={`${montserrat.className} mt-1 block text-[8px] tracking-[0.2em] text-[#704F43]`}
                >
                  JOYERÍA Y ACCESORIOS
                </span>
              </span>
            </a>
          </div>
        </header>

        <section
          id="inicio"
          className="hero-blush-section relative isolate min-h-[660px] overflow-hidden bg-[#F1D5D5] sm:min-h-[700px] lg:min-h-[620px]"
        >
          <div
            className="hero-blush-photo absolute inset-0 -z-20 bg-cover"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=2000&q=90')",
            }}
            role="img"
            aria-label="Colección de joyería dorada"
          />
          <div
            aria-hidden="true"
            className="hero-blush-gradient absolute inset-0 -z-10"
          />
          <div className="mx-auto flex min-h-[660px] max-w-7xl items-start px-6 py-16 sm:min-h-[700px] sm:px-10 sm:py-20 lg:min-h-[620px] lg:items-center lg:px-12 lg:py-20 xl:px-16">
            <div className="w-full max-w-xl">
              <p className="mb-5 font-boutique text-[10px] font-medium uppercase tracking-[2px] text-[#8C6849] sm:text-xs">
                Pequeños detalles, grandes momentos
              </p>
              <h1 className="font-editorial text-5xl leading-[1.02] tracking-[-0.025em] text-[#301C18] sm:text-6xl lg:text-7xl">
                Brilla con
                <br />
                <span className="italic text-[#A7794F]">tu propia luz.</span>
              </h1>
              <p className="mt-6 max-w-md text-sm font-medium leading-7 text-[#392820] sm:text-base">
                Joyas y accesorios elegidos con cariño para acompañarte todos
                los días y celebrar quién eres.
              </p>
              <a
                href="#coleccion"
                className="mt-8 inline-flex min-h-12 items-center border border-[#A7794F] bg-[#24150F] px-5 py-[14px] font-boutique text-[10px] font-medium uppercase tracking-[1.5px] text-white transition-colors duration-300 hover:bg-[#A7794F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#24150F] sm:mt-9 sm:px-7 sm:text-xs"
              >
                DESCUBRE NUESTRA COLECCIÓN →
              </a>
            </div>
          </div>
        </section>

        <section
          id="coleccion"
          className="mx-auto w-full max-w-[1400px] bg-[#FCF7F4] px-4 py-14 max-[639px]:px-3 max-[639px]:py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          {catalogError && (
            <p
              className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {catalogError}
            </p>
          )}
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#EADDD7] pb-6 max-[639px]:mb-6 max-[639px]:flex-row max-[639px]:items-end max-[639px]:gap-3 max-[639px]:pb-5 sm:mb-9 sm:flex-row sm:items-end sm:gap-6 sm:pb-7">
            <div>
              <p className="mb-2.5 font-boutique text-[9px] font-medium uppercase tracking-[0.22em] text-[#765B50] max-[639px]:mb-2 max-[639px]:text-[8px] max-[639px]:tracking-[0.16em] sm:text-[10px]">
                Joyas y accesorios para cada ocasión
              </p>
              <h2 className="font-editorial text-[2rem] leading-tight text-[#301C18] max-[639px]:text-[1.75rem] sm:text-4xl">
                Nuestra colección
              </h2>
            </div>
            <p className="shrink-0 font-boutique text-[10px] font-medium uppercase tracking-[0.16em] text-[#765B50] max-[639px]:text-[9px] max-[639px]:tracking-[0.1em] sm:pb-1 sm:text-[11px]">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </p>
          </div>

          <div
            className="scrollbar-none flex flex-wrap gap-x-5 overflow-visible whitespace-normal border-b border-[#EADDD7] pb-3 max-[639px]:-mx-3 max-[639px]:flex-nowrap max-[639px]:gap-x-4 max-[639px]:overflow-x-auto max-[639px]:whitespace-nowrap max-[639px]:px-3 sm:gap-x-6"
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
                  if (category !== "Dijes") {
                    setSelectedDijeSubcategory(null);
                  }
                  setSelectedCategory(category);
                  setSelectedAccessoryType(null);
                }}
                className={`border-b-2 pb-3 text-[13px] font-medium tracking-[0.015em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7794F] motion-reduce:transition-none max-[639px]:inline-flex max-[639px]:min-h-11 max-[639px]:shrink-0 max-[639px]:items-center max-[639px]:px-1 ${
                  selectedCategory === category
                    ? "-mb-[13px] border-[#B88645] font-semibold text-[#301C18]"
                    : "border-transparent text-[#765B50] hover:text-[#301C18]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory === "Varones" && (
            <div
              className="mt-4 flex flex-wrap gap-2 max-[639px]:mt-3 max-[639px]:gap-x-1.5 max-[639px]:gap-y-1.5"
              aria-label="Filtrar accesorios masculinos por tipo"
            >
              {masculineAccessoryFilters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={selectedAccessoryType === filter.value}
                  onClick={() => setSelectedAccessoryType(filter.value)}
                  className={`min-h-8 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7794F] motion-reduce:transition-none max-[639px]:min-h-10 max-[639px]:px-3 max-[639px]:py-2 max-[639px]:text-[11px] ${
                    selectedAccessoryType === filter.value
                      ? "border-[#301C18] bg-[#301C18] text-[#FCF7F4]"
                      : "border-[#EADDD7] bg-[#F9EFEB] text-[#765B50] hover:border-[#D9C4B9] hover:bg-[#F5E8E3]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {selectedCategory === "Dijes" && (
            <div
              className="mt-4 flex flex-wrap gap-2 max-[639px]:mt-3 max-[639px]:gap-x-1.5 max-[639px]:gap-y-1.5"
              aria-label="Filtrar dijes por subcategoría"
            >
              {(
                [
                  { label: "Todos los dijes", value: null },
                  { label: "Iniciales", value: "Iniciales" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={selectedDijeSubcategory === filter.value}
                  onClick={() => {
                    if (
                      filter.value === "Iniciales" &&
                      selectedMaterial !== null &&
                      selectedMaterial !== "Xuping" &&
                      selectedMaterial !== "Acero"
                    ) {
                      setSelectedMaterial(null);
                    }
                    setSelectedDijeSubcategory(filter.value);
                  }}
                  className={`min-h-8 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7794F] motion-reduce:transition-none max-[639px]:min-h-10 max-[639px]:px-3 max-[639px]:py-2 max-[639px]:text-[11px] ${
                    selectedDijeSubcategory === filter.value
                      ? "border-[#301C18] bg-[#301C18] text-[#FCF7F4]"
                      : "border-[#EADDD7] bg-[#F9EFEB] text-[#765B50] hover:border-[#D9C4B9] hover:bg-[#F5E8E3]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          <div
            className="mt-4 mb-8 flex flex-wrap gap-2 max-[639px]:mt-3 max-[639px]:mb-6 max-[639px]:gap-x-1.5 max-[639px]:gap-y-1.5"
            aria-label="Filtrar por material o colección"
          >
            {visibleMaterialFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                aria-pressed={selectedMaterial === filter.value}
                onClick={() => setSelectedMaterial(filter.value)}
                className={`min-h-8 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7794F] motion-reduce:transition-none max-[639px]:min-h-10 max-[639px]:px-3 max-[639px]:py-2 max-[639px]:text-[11px] ${
                  selectedMaterial === filter.value
                    ? "border-[#301C18] bg-[#301C18] text-[#FCF7F4]"
                    : "border-[#EADDD7] bg-[#F9EFEB] text-[#765B50] hover:border-[#D9C4B9] hover:bg-[#F5E8E3]"
                }`}
              >
                {filter.value === "Xuping"
                  ? selectedCategory === "Aritos" ||
                    selectedCategory === "Argollas"
                    ? "Marca Xuping Bañado en oro y Antialergico"
                    : "Marca Xuping Bañado en oro"
                  : filter.label}
              </button>
            ))}
          </div>

          <div
            id="productos"
            className="grid grid-cols-2 gap-x-3 gap-y-8 max-[639px]:gap-y-7 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-4"
          >
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group min-w-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <Link
                  href={getProductHref(product)}
                  className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7794F] sm:rounded-2xl"
                  aria-label={`Ver detalles de ${product.name}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F9EFEB] sm:rounded-2xl">
                    <Image
                      src={product.image}
                      aria-label={product.name}
                      alt={product.name}
                      width={900}
                      height={900}
                      sizes="(max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
                      unoptimized
                      className="aspect-square w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <span className="absolute left-2 top-2 rounded-full border border-white/70 bg-[#FCF7F4]/90 px-2 py-1 text-[9px] font-semibold tracking-wide text-[#765B50] backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">
                      {materialBadgeLabels[product.material]}
                    </span>
                    {!product.inStock && (
                      <span className="absolute bottom-2 left-2 rounded-full border border-white/70 bg-[#FCF7F4]/90 px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#301C18] backdrop-blur-sm sm:bottom-3 sm:left-3">
                        Agotado
                      </span>
                    )}
                  </div>
                  <div className="px-0.5 pt-3 sm:px-1 sm:pt-4">
                    <p className="text-[8px] font-medium uppercase leading-relaxed tracking-[0.1em] text-[#765B50] max-[639px]:text-[9px] max-[639px]:tracking-[0.07em] sm:text-[10px] sm:tracking-[0.12em]">
                      {product.category}
                      {product.accessoryType && ` · ${product.accessoryType}`}
                      {" · "}
                      {materialLabels[product.material]}
                    </p>
                    <div className="mt-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <h3 className="min-w-0 text-[13px] font-medium leading-snug text-[#301C18] max-[639px]:text-sm sm:text-sm">
                        {product.name}
                      </h3>
                      <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#9A6B35] sm:text-base">
                        {bolivianCurrency.format(product.price)}
                      </p>
                    </div>
                    {product.closureType && (
                      <p className="mt-1 block text-[11px] font-normal text-[#765B50] sm:text-xs">
                        Cierre: {product.closureType}
                      </p>
                    )}
                  </div>
                </Link>
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
          className="flex flex-col items-center justify-center bg-rose/55 px-6 py-24 text-center md:py-32"
        >
          <p className="font-boutique text-xs uppercase tracking-[0.3em] text-stone-500">
            Un regalo para ti
          </p>
          <h2 className="mt-6 max-w-3xl font-editorial text-3xl leading-snug text-neutral-800 md:text-5xl lg:text-6xl">
            La belleza está en los detalles que hablan de ti.
          </h2>
        </section>

        <footer
          id="contacto"
          className="bg-darkBrown px-6 py-7 text-center text-[10px] tracking-[0.12em] text-cream/70"
        >
          Sarita Joyería y Accesorios · Hecho con cariño
        </footer>
      </motion.main>
    </>
  );
}
