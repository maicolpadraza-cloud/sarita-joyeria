import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getAllProducts } from "@/lib/product-repository";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await headers();
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL or deploy on Vercel to generate the sitemap.",
    );
  }

  const products = await getAllProducts();
  const now = new Date();
  return [
    {
      url: siteUrl.toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...products.map((product) => ({
      url: new URL(
        `/productos/${encodeURIComponent(product.id)}`,
        siteUrl,
      ).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
