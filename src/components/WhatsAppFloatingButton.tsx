"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { createGeneralInquiryUrl } from "@/lib/whatsapp";

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const href = createGeneralInquiryUrl();

  if (pathname.startsWith("/productos/") || pathname.startsWith("/admin")) {
    return null;
  }

  if (!href) {
    if (process.env.NODE_ENV !== "development") {
      return null;
    }

    return (
      <p
        className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)] rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg"
        role="alert"
      >
        Configura NEXT_PUBLIC_WHATSAPP_NUMBER en .env.local para habilitar
        WhatsApp.
      </p>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#128C5A] px-5 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-[#0D744A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D744A]"
    >
      <MessageCircle aria-hidden="true" size={22} />
      <span>Consultas por WhatsApp</span>
    </a>
  );
}
