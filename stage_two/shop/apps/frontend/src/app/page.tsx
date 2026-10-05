import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { getFeaturedProducts } from "@/lib/catalog";

export default async function Home() {
  const featuredProducts = await getFeaturedProducts(3);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <main className="mx-auto max-w-[var(--content-width)] px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.1rem] border border-[#e9decc] bg-[radial-gradient(circle_at_top_left,_rgba(235,200,255,0.7),_transparent_30%),linear-gradient(135deg,#fdf9f2_0%,#f4efe8_35%,#f2f0eb_100%)] shadow-[0_24px_60px_rgba(32,26,18,0.08)]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),rgba(255,255,255,0)_55%)]" />
          <div className="relative grid items-center gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-12">
            <div>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.26em] text-slate-600">
                Autumn / winter 2026
              </p>
              <h1 className="font-display max-w-xl text-4xl leading-none tracking-[-0.06em] text-slate-900 md:text-6xl">
                Build a softer ritual around what you wear.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                Thoughtful layers, elevated essentials, and everyday pieces designed to move beautifully from morning to evening.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="#shop" className="button-lime">
                  Shop collection
                </Link>
                <Link href="/products" className="rounded-full border border-slate-300 bg-[#f6f2ea] px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-[#efe7db]">
                  Explore catalog
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5">Free shipping over $100</span>
                <span>New seasonal drops</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 top-8 h-32 w-32 rounded-full bg-[#ebc8ff]/60 blur-3xl" />
              <div className="absolute -left-6 bottom-8 h-28 w-28 rounded-full bg-[#dfeec5]/70 blur-3xl" />
              <div className="relative grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.7rem] border border-slate-200 bg-white/70 p-4 shadow-[0_20px_45px_rgba(32,26,18,0.08)] backdrop-blur-sm">
                  <div
                    className="h-64 rounded-[1.3rem] bg-cover bg-center"
                    style={{
                      backgroundImage: featuredProducts[0]?.imageUrl
                        ? `url(${featuredProducts[0].imageUrl})`
                        : "linear-gradient(135deg, #f5e8fc, #e9ff70)",
                    }}
                  />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Editor’s pick</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {featuredProducts[0]?.name ?? "Northstar Set"}
                      </h2>
                    </div>
                    <span className="text-base font-semibold text-slate-900">
                      ${featuredProducts[0]?.price.toFixed(2) ?? "148.00"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.7rem] border border-slate-200 bg-[#faf4ee] p-5 shadow-[0_20px_45px_rgba(32,26,18,0.05)]">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Curated edit</p>
                    <h3 className="mt-3 font-display text-3xl leading-none tracking-[-0.05em] text-slate-900">Soft structure.
                    Lived in ease.</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Minimal silhouettes with useful details and a sense of quiet confidence.</p>
                  </div>
                  <div className="rounded-[1.7rem] border border-slate-200 bg-white/80 p-4 shadow-[0_20px_45px_rgba(32,26,18,0.04)]">
                    <div
                      className="h-44 rounded-[1.2rem] bg-cover bg-center"
                      style={{
                        backgroundImage: featuredProducts[1]?.imageUrl
                          ? `url(${featuredProducts[1].imageUrl})`
                          : "linear-gradient(135deg, #dfeec5, #f7d9cf)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="shop" className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Featured pieces</p>
              <h2 className="mt-2 font-display text-4xl tracking-[-0.05em] text-slate-900">
                Designed to live in.
              </h2>
            </div>
            <Link href="/products" className="hidden text-sm font-medium text-slate-700 hover:text-slate-900 md:block">
              View all products →
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-[0_12px_30px_rgba(32,26,18,0.04)]">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">01</p>
              <h3 className="mt-3 font-display text-3xl tracking-[-0.05em] text-slate-900">Elevated basics</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Purposeful silhouettes that work from weekday routines to weekend plans.</p>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">02</p>
              <h3 className="mt-3 font-display text-3xl tracking-[-0.05em] text-slate-900">Thoughtful textures</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Natural fabrics, tactile finishes, and quiet details chosen for lasting wear.</p>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">03</p>
              <h3 className="mt-3 font-display text-3xl tracking-[-0.05em] text-slate-900">Made for rituals</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">A collection designed to feel considered, effortless, and distinctly personal.</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
