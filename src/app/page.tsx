import { Suspense } from "react";
import HomePage, { type HomePageFilters } from "@/components/HomePage";
import {
  categories,
  materialFilters,
  type MasculineAccessoryType,
} from "@/lib/products";

type HomeRouteProps = {
  searchParams: Promise<{
    category?: string | string[];
    material?: string | string[];
    dije?: string | string[];
    accessory?: string | string[];
  }>;
};

const accessoryTypes: MasculineAccessoryType[] = [
  "Cadenas",
  "Pulseras",
  "Anillos",
  "Billeteras",
];

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function Home(props: HomeRouteProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FCF7F4]" aria-label="Cargando tienda" />
      }
    >
      <HomePageContent {...props} />
    </Suspense>
  );
}

async function HomePageContent({ searchParams }: HomeRouteProps) {
  const query = await searchParams;
  const requestedCategory = firstValue(query.category);
  const requestedMaterial = firstValue(query.material);
  const requestedAccessory = firstValue(query.accessory);
  const initialFilters: HomePageFilters = {
    category:
      categories.find((category) => category === requestedCategory) ?? "Todos",
    material:
      materialFilters.find((filter) => filter.value === requestedMaterial)
        ?.value ?? null,
    dijeSubcategory:
      firstValue(query.dije) === "Iniciales" ? "Iniciales" : null,
    accessoryType:
      accessoryTypes.find((type) => type === requestedAccessory) ?? null,
  };

  return <HomePage initialFilters={initialFilters} />;
}
