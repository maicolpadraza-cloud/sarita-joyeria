"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  materialBadgeLabels,
  materialLabels,
  type Product,
} from "@/lib/products";
import { isAllowedProductImageUrl } from "@/lib/product-validation";
import {
  PRODUCTS_UPDATED_EVENT,
  readProducts,
} from "@/lib/product-storage";
import { fetchProductById } from "@/lib/products-api";
import {
  createProductOrderUrl,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/site-url";

const bolivianCurrency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

function subscribeToOrigin(): () => void {
  return () => {};
}

function getOriginSnapshot(): string {
  return getSiteUrl()?.origin ?? window.location.origin;
}

function getServerOriginSnapshot(): string {
  return getSiteUrl()?.origin ?? "";
}

type ProductDetailProps = {
  productId: string;
  returnHref: string;
};

export default function ProductDetail({
  productId,
  returnHref,
}: ProductDetailProps) {
  const siteOrigin = useSyncExternalStore(
    subscribeToOrigin,
    getOriginSnapshot,
    getServerOriginSnapshot,
  );
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);

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

        const apiMessage =
          apiError instanceof Error
            ? apiError.message
            : "No se pudo cargar la información de esta joya.";
        if (process.env.NODE_ENV === "development") {
          try {
            const fallbackProduct =
              readProducts().find((item) => item.id === productId) ?? null;
            setProduct(fallbackProduct);
            setLoadError(
              fallbackProduct
                ? ""
                : `${apiMessage} El respaldo local de desarrollo no contiene este producto.`,
            );
          } catch (storageError) {
            const storageMessage =
              storageError instanceof Error
                ? storageError.message
                : "No se pudieron cargar los datos locales.";
            setProduct(null);
            setLoadError(`${apiMessage} ${storageMessage}`);
          }
        } else {
          setProduct(null);
          setLoadError(`${apiMessage} Inténtalo de nuevo más tarde.`);
        }
      } finally {
        if (isMounted && currentRequest === requestVersion) {
          setIsLoading(false);
          setLoadedProductId(productId);
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

  if (isLoading || loadedProductId !== productId) {
    return (
      <main
        className="min-h-screen animate-pulse bg-[#FCF7F4] px-5 py-10 motion-reduce:animate-none sm:px-8"
        aria-busy="true"
        aria-label="Cargando información del producto"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="aspect-square rounded-2xl bg-[#EADDD7]" />
          <div className="space-y-5">
            <div className="h-4 w-1/3 rounded bg-[#EADDD7]" />
            <div className="h-10 w-4/5 rounded bg-[#EADDD7]" />
            <div className="h-8 w-1/3 rounded bg-[#EADDD7]" />
            <div className="h-28 rounded-xl bg-[#EADDD7]" />
            <div className="h-14 w-full rounded-xl bg-[#EADDD7] sm:w-72" />
          </div>
        </div>
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

  const currentProduct = product;
  const productUrl = siteOrigin
    ? new URL(
        `/productos/${encodeURIComponent(currentProduct.id)}`,
        siteOrigin,
      ).toString()
    : "";
  const whatsappHref = productUrl
    ? createProductOrderUrl(
        currentProduct,
        productUrl,
        !currentProduct.inStock,
      )
    : null;

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
          <ProductImage
            src={
              isAllowedProductImageUrl(product.image)
                ? product.image
                : "/logo-luna.png"
            }
            alt={product.name}
            fill
            sizes="(max-width: 1023px) 100vw, 50vw"
            transformWidth={1600}
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

          {!isWhatsAppConfigured() ? (
            <p
              className="mt-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="alert"
            >
              WhatsApp no está configurado. Contacta con la tienda para
              consultar este producto.
            </p>
          ) : whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center border border-[#A7794F] bg-[#24150F] px-6 py-3.5 text-center font-boutique text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#A7794F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#24150F] motion-reduce:transition-none sm:w-auto sm:min-w-72"
            >
              {currentProduct.inStock
                ? "Pedir por WhatsApp"
                : "Consultar disponibilidad"}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center border border-[#A7794F] bg-[#24150F] px-6 py-3.5 text-center font-boutique text-xs font-medium uppercase tracking-[0.12em] text-white opacity-70 sm:w-auto sm:min-w-72"
            >
              Preparando enlace…
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
