import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: params.category,
      search: params.q,
    }),
  ]);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <main className="mx-auto max-w-[var(--content-width)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-[#e9decc] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(244,239,232,0.9))] p-6 shadow-[0_12px_28px_rgba(32,26,18,0.04)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-slate-500">Shop all</p>
            <h1 className="mt-2 font-display text-4xl tracking-[-0.06em] text-slate-900">Curated essentials</h1>
          </div>

          <form method="get" action="/products" className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search products"
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500"
            />
            <select
              name="category"
              defaultValue={params.category ?? ""}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <button type="submit" className="button-lime button-compact text-slate-900">
              Apply
            </button>
          </form>
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-[0_8px_20px_rgba(32,26,18,0.04)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Categories</h2>

            <div className="mt-5 space-y-2">
              <Link
                href="/products"
               
              >
                <p  className={`block rounded-full px-3 py-2 text-sm transition ${
                  !params.category ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}>All products</p>
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                 
                >
                 <p  className={`block rounded-full px-3 py-2 text-sm transition ${
                    params.category === category.slug ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`} 
                 >{category.name}</p>
                </Link>
              ))}
            </div>
          </aside>

          <section>
            {products.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-[0_12px_28px_rgba(32,26,18,0.03)]">
                <p className="text-lg font-medium text-slate-900">No products match your filters.</p>
                <p className="mt-2 text-sm text-slate-600">Try another search term or reset the category filter.</p>
                <Link href="/products" className="mt-5 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">
                  <span className="text-white">Reset filters</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
