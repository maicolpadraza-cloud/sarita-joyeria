import { materialLabels, type Product } from "@/lib/products";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
let hasWarnedAboutMissingNumber = false;

const bolivianCurrency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

function getWhatsAppNumber(): string | null {
  if (/^\d{8,15}$/.test(whatsappNumber)) {
    return whatsappNumber;
  }

  if (
    process.env.NODE_ENV === "development" &&
    !hasWarnedAboutMissingNumber
  ) {
    console.warn(
      "Configura NEXT_PUBLIC_WHATSAPP_NUMBER con el número internacional sin + ni espacios para habilitar los enlaces de WhatsApp.",
    );
    hasWarnedAboutMissingNumber = true;
  }

  return null;
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppNumber() !== null;
}

function createWhatsAppUrl(message: string): string | null {
  const number = getWhatsAppNumber();
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}

export function createProductOrderMessage(
  product: Product,
  productUrl: string,
  isAvailabilityInquiry = false,
): string {
  return [
    isAvailabilityInquiry
      ? "Hola, SARITA. 💖 Quisiera consultar la disponibilidad de esta joya:"
      : "Hola, SARITA. 💖 Me interesa esta joya:",
    "",
    `✨ Producto: ${product.name}`,
    `💎 Categoría: ${product.category}`,
    `🏷️ Material: ${materialLabels[product.material]}`,
    `💰 Precio: ${bolivianCurrency.format(product.price)}`,
    `🔗 Enlace: ${productUrl}`,
    "",
    isAvailabilityInquiry
      ? "¿Podrían confirmarme si está disponible?"
      : "¿Podrían darme más información sobre este producto?",
    "",
    "¡Muchas gracias!",
  ].join("\n");
}

export function createProductOrderUrl(
  product: Product,
  productUrl: string,
  isAvailabilityInquiry = false,
): string | null {
  return createWhatsAppUrl(
    createProductOrderMessage(product, productUrl, isAvailabilityInquiry),
  );
}

export function createGeneralInquiryUrl(): string | null {
  return createWhatsAppUrl(
    "Hola, SARITA. 💖 Quisiera recibir más información sobre sus joyas y accesorios.",
  );
}
