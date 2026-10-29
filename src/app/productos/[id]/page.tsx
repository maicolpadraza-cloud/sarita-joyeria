import type { Metadata } from "next";
import { Suspense } from "react";
import ProductDetail from "@/components/ProductDetail";
import { categories, materialFilters } from "@/lib/products";
import type { MasculineAccessoryType } from "@/lib/products";
import { getProductById } from "@/lib/product-repository";
import { getSiteUrl } from "@/lib/site-url";
import { isAllowedProductImageUrl } from "@/lib/product-validation";

type ProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    category?: string | string[];
    material?: string | string[];
    dije?: string | string[];
    accessory?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) {
      return { title: "Joya no encontrada | Sarita Joyería" };
    }

    return {
      title: `${product.name} | Sarita Joyería`,
      description: `${product.category} de ${product.material}. ${product.description}`,
      alternates: {
        canonical: `/productos/${encodeURIComponent(product.id)}`,
      },
      openGraph: {
        type: "website",
        title: `${product.name} | Sarita Joyería`,
        description: `${product.category} de ${product.material}. ${product.description}`,
        url: `/productos/${encodeURIComponent(product.id)}`,
        images: [
          isAllowedProductImageUrl(product.image)
            ? product.image
            : "/logo-luna.png",
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Sarita Joyería`,
        description: `${product.category} de ${product.material}. ${product.description}`,
        images: [
          isAllowedProductImageUrl(product.image)
            ? product.image
            : "/logo-luna.png",
        ],
      },
      ...(getSiteUrl() ? { metadataBase: getSiteUrl() } : {}),
    };
  } catch (error) {
    console.error("Could not generate product sharing metadata:", error);
    return { title: "Sarita Joyería y Accesorios" };
  }
}

const accessoryTypes: MasculineAccessoryType[] = [
  "Cadenas",
  "Pulseras",
  "Anillos",
  "Billeteras",
];

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ProductPage(props: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FCF7F4] px-6 text-sm text-[#765B50]">
          Cargando información de la joya…
        </main>
      }
    >
      <ProductPageContent {...props} />
    </Suspense>
  );
}

async function ProductPageContent({
  params,
  searchParams,
}: ProductPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnParams = new URLSearchParams();
  const category = firstValue(query.category);
  const material = firstValue(query.material);
  const dije = firstValue(query.dije);
  const accessoryValue = firstValue(query.accessory);
  const validCategory = categories.find((item) => item === category);
  const validMaterial = materialFilters.find(
    (item) => item.value === material && item.value !== null,
  )?.value;
  const validAccessory = accessoryTypes.find(
    (item) => item === accessoryValue,
  );

  if (validCategory) {
    returnParams.set("category", validCategory);
  }
  if (validMaterial) {
    returnParams.set("material", validMaterial);
  }
  if (dije === "Iniciales") {
    returnParams.set("dije", dije);
  }
  if (validAccessory) {
    returnParams.set("accessory", validAccessory);
  }

  const returnQuery = returnParams.toString();
  const returnHref = returnQuery
    ? `/?${returnQuery}#coleccion`
    : "/#coleccion";

  return <ProductDetail productId={id} returnHref={returnHref} />;
}
