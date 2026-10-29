"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "No se pudo iniciar sesión.";
        setError(message);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FCF7F4] px-5 py-10 text-[#301C18]">
      <section className="w-full max-w-md rounded-3xl border border-[#EADDD7] bg-white p-7 shadow-xl sm:p-9">
        <Link
          href="/"
          className="text-sm font-medium text-[#765B50] underline decoration-[#B88645] underline-offset-4 hover:text-[#301C18]"
        >
          Volver a la tienda
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#765B50]">
          Sarita Joyería y Accesorios
        </p>
        <h1 className="mt-3 font-editorial text-3xl">Acceso de administración</h1>
        <p className="mt-3 text-sm leading-6 text-[#765B50]">
          Ingresa tus credenciales para administrar el catálogo.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Usuario
            <input
              autoComplete="username"
              className="mt-2 min-h-12 w-full rounded-xl border border-[#EADDD7] bg-[#FCF7F4] px-4 text-base outline-none focus:border-[#A7794F] focus:ring-2 focus:ring-[#A7794F]/20"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={256}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              className="mt-2 min-h-12 w-full rounded-xl border border-[#EADDD7] bg-[#FCF7F4] px-4 text-base outline-none focus:border-[#A7794F] focus:ring-2 focus:ring-[#A7794F]/20"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && (
            <p
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 w-full rounded-xl bg-[#301C18] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#765B50] disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
