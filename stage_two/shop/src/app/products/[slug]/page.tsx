import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { getProductBySlug, getProducts } from "@/lib/catalog";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getProducts({
    categorySlug: product.categorySlug ?? undefined,
  });

  const filteredRelated = relatedProducts.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <main className="mx-auto max-w-[var(--content-width)] px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/products" className="mb-8 inline-flex text-sm font-medium text-slate-600 transition hover:text-slate-900">
          ← Back to products
        </Link>

        <article className="grid gap-8 rounded-[2rem] border border-[#e9decc] bg-white/80 p-6 shadow-[0_18px_45px_rgba(32,26,18,0.05)] lg:grid-cols-[1.12fr_0.88fr] lg:p-8">
          <div
            className="h-[430px] rounded-[1.6rem] bg-cover bg-center"
            style={{
              backgroundImage: product.imageUrl
                ? `url(${product.imageUrl})`
                : "linear-gradient(135deg, #e2e8f0, #d1fae5)",
            }}
          />

          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-slate-500">
              {product.categoryName ?? "General"}
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none tracking-[-0.06em] text-slate-900">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-semibold text-slate-900">
              {formatPrice(product.price)}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>

            <div className="mt-6 flex items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-[#dfeec5] px-2.5 py-1 font-medium text-slate-800">
                {product.stock > 0 ? "In stock" : "Out of stock"}
              </span>
              <span>{product.stock} available</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <AddToCartButton product={product} />
              <Link
                href="/products"
                className="rounded-full border border-slate-300 bg-[#f6f2ea] px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-[#efe7db]"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </article>

        {filteredRelated.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.26em] text-slate-500">Related items</p>
                <h2 className="mt-2 font-display text-4xl tracking-[-0.05em] text-slate-900">More from this collection</h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {filteredRelated.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
