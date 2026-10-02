import { inArray } from "drizzle-orm";
import { db } from "../src/db/index";
import { categories } from "../src/db/schema/categories";
import { products } from "../src/db/schema/products";

const categorySeeds = [
  {
    name: "Home & Living",
    slug: "home-living",
    description: "Thoughtful pieces for calmer spaces and everyday routines.",
  },
  {
    name: "Desk Essentials",
    slug: "desk-essentials",
    description: "Functional tools and quiet upgrades for focused workdays.",
  },
  {
    name: "Lighting",
    slug: "lighting",
    description: "Warm, ambient pieces that make a room feel complete.",
  },
];

const productSeeds = [
  {
    name: "Cotton Storage Basket",
    slug: "cotton-storage-basket",
    description: "A soft woven basket for shelves, entryways, and hidden organization.",
    price: "36.00",
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80",
    categorySlug: "home-living",
  },
  {
    name: "Oak Desk Tray",
    slug: "oak-desk-tray",
    description: "A compact, handcrafted tray to keep notes, hardware, and daily essentials together.",
    price: "42.00",
    stock: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    categorySlug: "desk-essentials",
  },
  {
    name: "Luna Table Lamp",
    slug: "luna-table-lamp",
    description: "A warm accent lamp designed to soften corners and create a calm evening glow.",
    price: "74.00",
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    categorySlug: "lighting",
  },
  {
    name: "Linen Throw Blanket",
    slug: "linen-throw-blanket",
    description: "Lightweight comfort for reading nooks, couches, and layered seasonal styling.",
    price: "59.00",
    stock: 19,
    imageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    categorySlug: "home-living",
  },
  {
    name: "Leather Journal Set",
    slug: "leather-journal-set",
    description: "A premium pairing of journal and pen for thoughtful planning and reflection.",
    price: "28.00",
    stock: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    categorySlug: "desk-essentials",
  },
  {
    name: "Halo Pendant Light",
    slug: "halo-pendant-light",
    description: "A sculptural pendant that adds graceful warmth and a modern finishing touch.",
    price: "88.00",
    stock: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    categorySlug: "lighting",
  },
];

void (async () => {
  await db.insert(categories).values(categorySeeds).onConflictDoNothing();

  const insertedCategories = await db
    .select()
    .from(categories)
    .where(inArray(categories.slug, categorySeeds.map((category) => category.slug)));

  const categoryMap = new Map(
    insertedCategories.map((category) => [category.slug, category.id]),
  );

  const rows = productSeeds.flatMap((product) => {
    const categoryId = categoryMap.get(product.categorySlug);

    if (!categoryId) {
      return [];
    }

    return [
      {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        categoryId,
        isActive: true,
      },
    ];
  });

  await db.insert(products).values(rows).onConflictDoNothing();

  console.log(`Seeded ${rows.length} products and ${categorySeeds.length} categories.`);
})();
