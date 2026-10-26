"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

type SplashScreenProps = {
  onComplete: () => void;
};

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2300);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#DFB9B9]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: "easeInOut" }}
      aria-label="Bienvenida a Sarita Joyería y Accesorios"
      role="status"
    >
      <motion.div
        className="relative flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <Image
          src="/logo-luna.png"
          alt="Isotipo de luna de Sarita"
          width={132}
          height={79}
          priority
          className="mb-3 h-auto w-32 object-contain animate-moon-reveal sm:w-36"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(24%) sepia(20%) saturate(1500%) hue-rotate(345deg) brightness(70%) contrast(100%)",
          }}
        />
        <div className="relative inline-block">
          <span className="block font-serif text-5xl tracking-[0.16em] text-[#5C4033] sm:text-6xl">
            SARITA
          </span>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 block bg-clip-text font-serif text-5xl tracking-[0.16em] text-transparent sm:text-6xl"
            style={{
              backgroundImage:
                "linear-gradient(110deg, transparent 35%, #c5a059 48%, #fff4d6 50%, #c5a059 52%, transparent 65%)",
              backgroundSize: "250% 100%",
            }}
            animate={{ backgroundPosition: ["100% 0", "-100% 0"] }}
            transition={{
              duration: 2,
              delay: 0.6,
              repeat: Infinity,
              repeatDelay: 2.2,
              ease: "easeInOut",
            }}
          >
            SARITA
          </motion.span>
        </div>
        <p className="mt-3 text-[9px] tracking-[0.36em] text-stone-900 sm:text-[10px]">
          JOYERÍA Y ACCESORIOS
        </p>
        <motion.div
          className="mx-auto mt-7 h-px bg-stone-900"
          initial={{ width: 0 }}
          animate={{ width: 72 }}
          transition={{ duration: 1, delay: 0.35, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
