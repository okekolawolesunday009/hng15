import "server-only";

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

type BackendCatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  isActive: boolean;
  createdAt?: string | Date;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const toCatalogProduct = (product: BackendCatalogProduct): CatalogProduct => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: Number(product.price),
  stock: product.stock,
  imageUrl: product.imageUrl,
  categoryId: product.categoryId ?? "",
  categoryName: product.categoryName ?? null,
  categorySlug: product.categorySlug ?? null,
  isActive: product.isActive,
  createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
});

async function fetchCatalogFromBackend<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { success?: boolean; data?: T };
    return payload.success ? payload.data ?? null : null;
  } catch {
    return null;
  }
}

export async function getCategories() {
  return await fetchCatalogFromBackend<Array<{ id: string; name: string; slug: string }>>("/api/v1/categories") ?? [];
}

export async function getFeaturedProducts(limit = 3) {
  const backendProducts = await fetchCatalogFromBackend<BackendCatalogProduct[]>(`/api/v1/products?limit=${limit}`);
  return Array.isArray(backendProducts) ? backendProducts.map(toCatalogProduct).slice(0, limit) : [];
}

export async function getProducts({
  categorySlug,
  search,
}: {
  categorySlug?: string;
  search?: string;
} = {}) {
  const params = new URLSearchParams();
  if (categorySlug) {
    params.set("category", categorySlug);
  }
  if (search && search.trim()) {
    params.set("search", search.trim());
  }

  const backendProducts = await fetchCatalogFromBackend<BackendCatalogProduct[]>(`/api/v1/products${params.size > 0 ? `?${params.toString()}` : ""}`);
  return Array.isArray(backendProducts) ? backendProducts.map(toCatalogProduct) : [];
}

export async function getProductBySlug(slug: string) {
  const backendProduct = await fetchCatalogFromBackend<BackendCatalogProduct>(`/api/v1/products/${encodeURIComponent(slug)}`);
  return backendProduct ? toCatalogProduct(backendProduct) : null;
}
