import { materialLabels, type Product } from "@/lib/products";

export const WHATSAPP_BUSINESS_NUMBER = "59175764100";

const bolivianCurrency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

export function createProductOrderMessage(product: Product): string {
  return [
    "Hola, SARITA. 💖 Quiero hacer un pedido de esta joya:",
    "",
    `✨ Producto: ${product.name}`,
    `💰 Precio: ${bolivianCurrency.format(product.price)}`,
    `💎 Categoría: ${product.category}`,
    `🏷️ Marca o material: ${materialLabels[product.material]}`,
    "",
    "¿Podrían confirmarme su disponibilidad y cómo realizar el pedido?",
    "",
    "¡Muchas gracias!",
  ].join("\n");
}

export function createProductOrderUrl(product: Product): string {
  const message = createProductOrderMessage(product);
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}
