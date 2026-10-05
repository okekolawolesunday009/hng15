"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/cart";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart, error, isLoading, isUpdating } = useCart();
  const hasUnavailableItems = items.some(
    (item) => !item.isActive || item.stock < 1 || item.quantity > item.stock,
  );

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
        <p role="status" className="text-sm text-slate-600">Loading your cart...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Your cart</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Your bag is empty</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
          Add a few essentials to your cart and continue to checkout when you are ready.
        </p>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        <Link
          href="/products"
          className="mt-8 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.18)] transition hover:bg-[#2d2d2d]"
        >
          <p className="text-white">Continue shopping</p>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Cart</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Review your items</h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          disabled={isUpdating}
          className="rounded-full border border-slate-300 bg-[#f6f2ea] px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-[#efe7db] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear cart
        </button>
      </div>

      {error ? <p role="alert" className="mb-6 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-5">
          {items.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
              <div
                className="h-28 w-full rounded-2xl bg-cover bg-center sm:w-28"
                style={{
                  backgroundImage: item.imageUrl
                    ? `url(${item.imageUrl})`
                    : "linear-gradient(135deg, #e2e8f0, #d1fae5)",
                }}
              />

              <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      {item.categoryName ?? "General"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.name}</h2>
                    {!item.isActive || item.stock < 1 ? (
                      <p className="mt-1 text-sm text-red-700">Unavailable</p>
                    ) : item.quantity > item.stock ? (
                      <p className="mt-1 text-sm text-red-700">Only {item.stock} available</p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">{item.stock} available</p>
                    )}
                  </div>
                  <span className="text-base font-semibold text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 rounded-full border border-slate-300 bg-slate-50 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isUpdating}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-700 transition hover:bg-white"
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm font-medium text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isUpdating || !item.isActive || item.quantity >= item.stock}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={isUpdating}
                    className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Summary</p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>

          {hasUnavailableItems ? (
            <p className="mt-8 text-sm text-red-700">Remove unavailable items or reduce quantities before checkout.</p>
          ) : (
            <Link
              href="/checkout"
              className="mt-8 block rounded-full bg-[#171717] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.2)] transition hover:bg-[#2d2d2d]"
            >
              <p className="text-white">Proceed to checkout</p>
            </Link>
          )}
        </aside>
        
      </div>
    </main>
  );
}
