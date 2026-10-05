"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/cart";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Checkout</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] text-slate-900">Your cart is empty</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Add an item before continuing to checkout.
        </p>
        <Link
          href="/products"
          className="mt-8 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,18,0.18)] transition hover:bg-[#2d2d2d]"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[var(--content-width)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Checkout</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.05em] text-slate-900">Review your cart</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="space-y-5 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6 shadow-[0_18px_45px_rgba(32,26,18,0.05)]">
          <div role="alert">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900">Checkout unavailable</p>
            <h2 className="mt-3 font-display text-2xl tracking-[-0.04em] text-slate-900">
              Payments are not set up yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              You can review your cart, but checkout is disabled until a payment provider is configured. No payment will be taken and no order will be placed.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-600"
          >
            Checkout unavailable
          </button>
          <Link
            href="/cart"
            className="block text-center text-sm font-semibold text-slate-800 underline underline-offset-4 hover:text-slate-950"
          >
            Return to cart
          </Link>
        </section>

        <aside className="rounded-[2rem] border border-[#e9decc] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(244,239,232,0.9))] p-6 shadow-[0_18px_45px_rgba(32,26,18,0.04)]">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Order summary</p>

          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
