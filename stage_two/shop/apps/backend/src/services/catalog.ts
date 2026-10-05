import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { categories } from "../db/schema/categories.ts";
import { products } from "../db/schema/products.ts";

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

export type CatalogFilters = {
  categorySlug?: string;
  search?: string;
  limit?: number;
};

export function normalizeCatalogFilters(filters: CatalogFilters = {}): CatalogFilters {
  const search = filters.search?.trim();
  const requestedLimit = filters.limit;

  return {
    categorySlug: filters.categorySlug ?? undefined,
    search: search && search.length > 0 ? search : undefined,
    limit: Number.isInteger(requestedLimit) && requestedLimit! > 0
      ? Math.min(requestedLimit!, 100)
      : 3,
  };
}

const productSelection = {
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
};

function formatProduct(row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string | null;
  categorySlug: string | null;
  isActive: boolean;
  createdAt: Date;
}): CatalogProduct {
  return { ...row, price: Number(row.price) };
}

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getFeaturedProducts(limit = 3): Promise<CatalogProduct[]> {
  return getProducts({ limit });
}

export async function getProducts(filters: CatalogFilters = {}): Promise<CatalogProduct[]> {
  const normalized = normalizeCatalogFilters(filters);
  const conditions = [eq(products.isActive, true)];
  if (normalized.categorySlug) conditions.push(eq(categories.slug, normalized.categorySlug));
  if (normalized.search) {
    const query = `%${normalized.search}%`;
    conditions.push(sql`(${products.name} ILIKE ${query} OR ${products.description} ILIKE ${query})`);
  }

  const rows = await db
    .select(productSelection)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(normalized.limit ?? 3);

  return rows.map(formatProduct);
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const [row] = await db
    .select(productSelection)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  return row ? formatProduct(row) : null;
}
