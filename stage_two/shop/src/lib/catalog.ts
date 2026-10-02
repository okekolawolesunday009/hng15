import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/categories";
import { products } from "@/db/schema/products";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string | null;
  categorySlug: string | null;
  isActive: boolean;
  createdAt: Date;
};

const formatProduct = (row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  isActive: boolean;
  createdAt: Date;
}): CatalogProduct => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: Number(row.price),
  stock: row.stock,
  imageUrl: row.imageUrl,
  categoryId: row.categoryId ?? "",
  categoryName: row.categoryName ?? null,
  categorySlug: row.categorySlug ?? null,
  isActive: row.isActive,
  createdAt: row.createdAt,
});

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getFeaturedProducts(limit = 3) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return rows.map(formatProduct);
}

export async function getProducts({
  categorySlug,
  search,
}: {
  categorySlug?: string;
  search?: string;
} = {}) {
  const conditions = [eq(products.isActive, true)];

  if (categorySlug) {
    conditions.push(eq(categories.slug, categorySlug));
  }

  if (search && search.trim()) {
    const query = `%${search.trim()}%`;
    conditions.push(
      sql`(${products.name} ILIKE ${query} OR ${products.description} ILIKE ${query})`,
    );
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt));

  return rows.map(formatProduct);
}

export async function getProductBySlug(slug: string) {
  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  return row ? formatProduct(row) : null;
}
