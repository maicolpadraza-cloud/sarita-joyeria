"use client";

import { motion } from "framer-motion";
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: "easeInOut" }}
      aria-label="Bienvenida a Sarita Joyería y Accesorios"
      role="status"
    >
      <motion.div
        className="absolute h-56 w-56 rounded-full bg-rose/60 blur-3xl sm:h-72 sm:w-72"
        animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative text-center"
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <div className="relative inline-block overflow-hidden px-3">
          <span className="font-serif text-5xl tracking-[0.16em] text-darkBrown sm:text-6xl">
            SARITA
          </span>
          <motion.span
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            animate={{ x: ["-150%", "450%"] }}
            transition={{
              duration: 1.6,
              delay: 0.65,
              repeat: Infinity,
              repeatDelay: 1.1,
              ease: "easeInOut",
            }}
          />
        </div>
        <p className="mt-3 text-[9px] tracking-[0.36em] text-warmBrown sm:text-[10px]">
          JOYERÍA Y ACCESORIOS
        </p>
        <motion.div
          className="mx-auto mt-7 h-px bg-gold"
          initial={{ width: 0 }}
          animate={{ width: 72 }}
          transition={{ duration: 1, delay: 0.35, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
