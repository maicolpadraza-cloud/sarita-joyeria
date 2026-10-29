export function getSiteUrl(): URL | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    const url = new URL(configuredUrl);
    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    ) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be an HTTPS origin without a path in production.",
      );
    }
    return url;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && typeof window === "undefined") {
    return new URL(`https://${vercelUrl}`);
  }

  if (typeof window !== "undefined") {
    return new URL(window.location.origin);
  }

  return undefined;
}
