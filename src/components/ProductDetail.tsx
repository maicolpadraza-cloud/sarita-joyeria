"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  materialBadgeLabels,
  materialLabels,
  products,
  type Product,
} from "@/lib/products";
import {
  PRODUCTS_UPDATED_EVENT,
  readProducts,
} from "@/lib/product-storage";
import { fetchProductById } from "@/lib/products-api";
import { createProductOrderUrl } from "@/lib/whatsapp";

const bolivianCurrency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

type ProductDetailProps = {
  productId: string;
  returnHref: string;
};

export default function ProductDetail({
  productId,
  returnHref,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(
    () => products.find((item) => item.id === productId) ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let requestVersion = 0;

    const refreshProduct = async () => {
      const currentRequest = ++requestVersion;

      try {
        const currentProduct = await fetchProductById(productId);
        if (!isMounted || currentRequest !== requestVersion) return;

        setProduct(currentProduct);
        setLoadError("");
      } catch (apiError) {
        if (!isMounted || currentRequest !== requestVersion) return;

        try {
          const fallbackProduct =
            readProducts().find((item) => item.id === productId) ?? null;
          setProduct(fallbackProduct);
          setLoadError(
            fallbackProduct
              ? ""
              : apiError instanceof Error
                ? apiError.message
                : "No se pudo cargar la información de esta joya.",
          );
        } catch (storageError) {
          setProduct(null);
          setLoadError(
            storageError instanceof Error
              ? storageError.message
              : "No se pudo cargar la información de esta joya.",
          );
        }
      } finally {
        if (isMounted && currentRequest === requestVersion) {
          setIsLoading(false);
        }
      }
    };

    refreshProduct();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProduct);
    window.addEventListener("storage", refreshProduct);

    return () => {
      isMounted = false;
      requestVersion++;
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProduct);
      window.removeEventListener("storage", refreshProduct);
    };
  }, [productId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FCF7F4] px-6 text-sm text-[#765B50]">
        Cargando información de la joya…
      </main>
    );
  }

  if (loadError || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FCF7F4] px-6 text-center">
        <p className="font-editorial text-3xl text-[#301C18]">
          {loadError ? "No se pudo cargar esta joya" : "Joya no encontrada"}
        </p>
        {loadError && (
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#765B50]" role="alert">
            {loadError}
          </p>
        )}
        <Link
          href={returnHref}
          className="mt-6 text-sm font-medium text-[#765B50] underline decoration-[#B88645] underline-offset-4 hover:text-[#301C18] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7794F]"
        >
          Volver a la colección
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCF7F4] text-[#301C18]">
      <header className="border-b border-[#EADDD7] bg-[#F1D5D5]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href={returnHref}
            className="text-sm font-medium text-[#765B50] underline decoration-[#B88645] underline-offset-4 transition-colors hover:text-[#301C18] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7794F]"
          >
            Volver a la colección
          </Link>
          <Link
            href="/#inicio"
            className="font-editorial text-lg tracking-wide text-[#8F4F5B] sm:text-xl"
            aria-label="Sarita Joyería y Accesorios, inicio"
          >
            SARITA
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F9EFEB]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1023px) 100vw, 50vw"
            unoptimized
            className="object-contain"
            priority
          />
          <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-[#FCF7F4]/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#765B50] backdrop-blur-sm">
            {materialBadgeLabels[product.material]}
          </span>
          {!product.inStock && (
            <span className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-[#FCF7F4]/90 px-3 py-1.5 text-xs uppercase tracking-wide text-[#301C18] backdrop-blur-sm">
              Agotado
            </span>
          )}
        </div>

        <div className="mx-auto w-full max-w-xl">
          <p className="font-boutique text-[10px] font-medium uppercase tracking-[0.2em] text-[#765B50]">
            {product.category}
            {product.accessoryType && ` · ${product.accessoryType}`}
          </p>
          <h1 className="mt-3 font-editorial text-3xl leading-tight text-[#301C18] sm:text-4xl lg:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-[#9A6B35]">
            {bolivianCurrency.format(product.price)}
          </p>

          <dl className="mt-7 space-y-4 border-y border-[#EADDD7] py-5 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="font-medium text-[#765B50]">Categoría:</dt>
              <dd>{product.category}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="font-medium text-[#765B50]">Marca o material:</dt>
              <dd>{materialLabels[product.material]}</dd>
            </div>
            {product.closureType && (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="font-medium text-[#765B50]">Cierre:</dt>
                <dd>{product.closureType}</dd>
              </div>
            )}
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="font-medium text-[#765B50]">Disponibilidad:</dt>
              <dd>{product.inStock ? "Disponible" : "Agotado"}</dd>
            </div>
          </dl>

          {product.description && (
            <p className="mt-6 text-sm leading-7 text-[#392820]">
              {product.description}
            </p>
          )}

          <a
            href={createProductOrderUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center border border-[#A7794F] bg-[#24150F] px-6 py-3.5 text-center font-boutique text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#A7794F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#24150F] motion-reduce:transition-none sm:w-auto sm:min-w-72"
          >
            Hacer pedido por WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
