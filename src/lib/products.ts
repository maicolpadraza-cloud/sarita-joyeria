export type ProductMaterial =
  | "Xuping"
  | "Magold"
  | "Folleado"
  | "Acero"
  | "Titanio"
  | "Artesanal"
  | "Cuero sintético";

export type ClosureType = "Mariposa" | "Tapa Plana" | "Argolla";

export type ProductCategory =
  | "Aritos"
  | "Argollas"
  | "Collares"
  | "Dijes"
  | "Rosarios"
  | "Anillos"
  | "Pulseras"
  | "Piercings"
  | "Titanio"
  | "Conjuntos"
  | "Relojes"
  | "Carteras"
  | "Billeteras"
  | "Mini joyeros"
  | "Varones"
  | "Tobilleras";

export type ProductSubcategory = "Iniciales";

export type MasculineAccessoryType =
  | "Cadenas"
  | "Pulseras"
  | "Anillos"
  | "Billeteras";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory?: ProductSubcategory;
  accessoryType?: MasculineAccessoryType;
  material: ProductMaterial;
  closureType?: ClosureType;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
}

export interface AdminProduct extends Product {
  imageKitFileId?: string;
}

export const categories = [
  "Todos",
  "Aritos",
  "Argollas",
  "Collares",
  "Dijes",
  "Rosarios",
  "Anillos",
  "Pulseras",
  "Piercings",
  "Titanio",
  "Conjuntos",
  "Relojes",
  "Carteras",
  "Billeteras",
  "Mini joyeros",
  "Varones",
  "Tobilleras",
] as const;

export const materialsByCategory: Record<ProductCategory, ProductMaterial[]> = {
  Aritos: ["Artesanal", "Folleado", "Acero", "Magold", "Xuping"],
  Argollas: ["Artesanal", "Folleado", "Acero", "Magold", "Xuping"],
  Collares: ["Artesanal", "Acero", "Magold", "Xuping"],
  Dijes: ["Artesanal", "Acero", "Magold", "Xuping"],
  Rosarios: ["Acero", "Xuping"],
  Anillos: ["Acero", "Magold", "Xuping"],
  Pulseras: ["Acero", "Magold", "Xuping"],
  Piercings: ["Acero", "Xuping"],
  Titanio: ["Titanio"],
  Conjuntos: ["Acero", "Xuping"],
  Relojes: ["Acero", "Xuping"],
  Carteras: [],
  Billeteras: [],
  "Mini joyeros": [],
  Varones: ["Acero", "Artesanal"],
  Tobilleras: ["Xuping", "Acero"],
};

export const categoryMaterialOptions: Record<
  ProductCategory,
  ProductMaterial[]
> = {
  Aritos: materialsByCategory.Aritos,
  Argollas: materialsByCategory.Argollas,
  Collares: materialsByCategory.Collares,
  Dijes: materialsByCategory.Dijes,
  Rosarios: materialsByCategory.Rosarios,
  Anillos: materialsByCategory.Anillos,
  Pulseras: materialsByCategory.Pulseras,
  Piercings: materialsByCategory.Piercings,
  Titanio: materialsByCategory.Titanio,
  Conjuntos: [...materialsByCategory.Conjuntos, "Magold"],
  Relojes: [...materialsByCategory.Relojes, "Magold"],
  Carteras: ["Cuero sintético"],
  Billeteras: ["Cuero sintético"],
  "Mini joyeros": ["Artesanal"],
  Varones: ["Acero", "Artesanal"],
  Tobilleras: ["Xuping", "Acero"],
};

export const materialFilters: {
  label: string;
  value: ProductMaterial | null;
}[] = [
  { label: "Todos los materiales", value: null },
  { label: "Marca Xuping (Bañado en Oro Antialérgico)", value: "Xuping" },
  { label: "Marca Magold (Bañado en Oro 24K)", value: "Magold" },
  { label: "Folleado", value: "Folleado" },
  { label: "Acero Inoxidable", value: "Acero" },
  { label: "Titanio", value: "Titanio" },
  { label: "Línea Artesanal", value: "Artesanal" },
];

export const materialLabels: Record<ProductMaterial, string> = {
  Xuping: "Marca Xuping · Oro antialérgico",
  Magold: "Marca Magold · Oro 24K",
  Folleado: "Folleado",
  Acero: "Acero inoxidable",
  Titanio: "Titanio",
  Artesanal: "Línea artesanal",
  "Cuero sintético": "Cuero sintético",
};

export const materialBadgeLabels: Record<ProductMaterial, string> = {
  Xuping: "Xuping",
  Magold: "Magold 24K",
  Folleado: "Folleado",
  Acero: "Acero",
  Titanio: "Titanio",
  Artesanal: "Artesanal",
  "Cuero sintético": "Cuero sintético",
};

export const products: Product[] = [
  {
    id: "aritos-xuping-mariposa",
    name: "Aritos Xuping Cierre Mariposa",
    category: "Aritos",
    material: "Xuping",
    closureType: "Mariposa",
    price: 125,
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85",
    description:
      "Aritos delicados con baño de oro antialérgico y cierre mariposa.",
    inStock: true,
  },
  {
    id: "aros-magold-tapa-plana",
    name: "Aros Magold Tapa Plana",
    category: "Aritos",
    material: "Magold",
    closureType: "Tapa Plana",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=85",
    description: "Diseño cómodo con baño de oro 24K y cierre de tapa plana.",
    inStock: true,
  },
  {
    id: "collar-artesanal-dije",
    name: "Collar Artesanal con Dije",
    category: "Collares",
    material: "Artesanal",
    price: 220,
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
    description: "Collar hecho a mano con un dije de acabado único.",
    inStock: true,
  },
  {
    id: "set-anillo-pulsera-folleado",
    name: "Set Anillo y Pulsera Folleado",
    category: "Anillos",
    material: "Folleado",
    price: 195,
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
    description:
      "Un conjunto versátil de anillo y pulsera para combinar a diario.",
    inStock: true,
  },
  {
    id: "piercing-acero",
    name: "Piercing de Acero Quirúrgico",
    category: "Piercings",
    material: "Acero",
    price: 85,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85",
    description: "Piercing de acero inoxidable, resistente y fácil de combinar.",
    inStock: true,
  },
  {
    id: "arito-titanio",
    name: "Arito de Titanio",
    category: "Titanio",
    material: "Titanio",
    price: 110,
    image:
      "https://images.unsplash.com/photo-1635767798638-3665a7c6c2f9?auto=format&fit=crop&w=900&q=85",
    description: "Arito liviano de titanio para una comodidad excepcional.",
    inStock: false,
  },
  {
    id: "reloj-dama-magold",
    name: "Reloj Dama Magold",
    category: "Relojes",
    material: "Magold",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=85",
    description: "Reloj femenino de estilo clásico con detalles dorados.",
    inStock: true,
  },
  {
    id: "billetera-artesanal",
    name: "Monedero Artesanal",
    category: "Carteras",
    material: "Artesanal",
    price: 320,
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85",
    description: "Monedero artesanal práctico para llevar tus esenciales.",
    inStock: true,
  },
  {
    id: "cadena-acero-hombre",
    name: "Cadenita de Acero para Hombre",
    category: "Varones",
    accessoryType: "Cadenas",
    material: "Acero",
    price: 185,
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
    description: "Cadena de acero inoxidable de estilo clásico y versátil.",
    inStock: true,
  },
  {
    id: "billetera-masculina-cuero",
    name: "Billetera Masculina de Cuero",
    category: "Varones",
    accessoryType: "Billeteras",
    material: "Artesanal",
    price: 390,
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85",
    description: "Billetera de cuero para hombre, práctica y atemporal.",
    inStock: true,
  },
  {
    id: "pulsera-varon-acero",
    name: "Pulsera de Acero para Varón",
    category: "Varones",
    accessoryType: "Pulseras",
    material: "Acero",
    price: 210,
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
    description: "Pulsera masculina de acero inoxidable con diseño sobrio.",
    inStock: true,
  },
  {
    id: "anillo-varon-acero",
    name: "Anillo de Acero para Varón",
    category: "Varones",
    accessoryType: "Anillos",
    material: "Acero",
    price: 160,
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
    description: "Anillo masculino de acero inoxidable con acabado pulido.",
    inStock: true,
  },
  {
    id: "tobillera-xuping-dorada",
    name: "Tobillera Xuping Dorada",
    category: "Tobilleras",
    material: "Xuping",
    price: 135,
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
    description:
      "Tobillera delicada con baño de oro antialérgico para lucir a diario.",
    inStock: true,
  },
  {
    id: "tobillera-acero-inoxidable",
    name: "Tobillera de Acero Inoxidable",
    category: "Tobilleras",
    material: "Acero",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
    description: "Tobillera de acero inoxidable, resistente y versátil.",
    inStock: true,
  },
];
