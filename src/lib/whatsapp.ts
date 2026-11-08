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
      ? "Hola, SARITA. \u{1F496} Quisiera consultar la disponibilidad de esta joya:"
      : "Hola, SARITA. \u{1F496} Me interesa esta joya:",
    "",
    `\u{2728} Producto: ${product.name}`,
    `\u{1F516} Código: ${product.code ?? "No disponible"}`,
    `\u{1F48E} Categoría: ${product.category}`,
    `\u{1F516} Material: ${materialLabels[product.material]}`,
    `\u{1F4B0} Precio: ${bolivianCurrency.format(product.price)}`,
    `\u{1F517} Enlace: ${productUrl}`,
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
    "Hola, SARITA. \u{1F496} Quisiera recibir más información sobre sus joyas y accesorios.",
  );
}
