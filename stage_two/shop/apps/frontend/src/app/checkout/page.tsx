"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/cart";

type CheckoutForm = {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
};

const initialForm: CheckoutForm = {
  name: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        <section className="space-y-5 rounded-[2rem] border border-[#e9decc] bg-white/80 p-6 shadow-[0_18px_45px_rgba(32,26,18,0.05)]">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <strong>Demo checkout:</strong> This creates a local order without charging a card or contacting a payment provider.
          </div>

          {message ? (
            <div className={`rounded-2xl border p-4 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="alert">
              {message.text}
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setIsSubmitting(true);
              setMessage(null);

              try {
                const response = await fetch("/api/backend/v1/orders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...form,
                    items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
                  }),
                });
                const payload = await response.json() as {
                  success?: boolean;
                  data?: { order?: { orderId?: string; paymentStatus?: string } };
                  error?: { message?: string };
                };

                if (!response.ok || !payload.success) {
                  throw new Error(payload.error?.message ?? "Checkout could not be completed.");
                }

                setMessage({
                  type: "success",
                  text: `Demo order created successfully. Order ${payload.data?.order?.orderId ?? "unknown"}. No payment was taken.`,
                });
                setForm(initialForm);
              } catch (error) {
                setMessage({
                  type: "error",
                  text: error instanceof Error ? error.message : "Checkout failed. Please try again.",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                placeholder="Your name"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Delivery address
              <input
                required
                minLength={8}
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                placeholder="Street and number"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                City
                <input
                  required
                  minLength={2}
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                  placeholder="City"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Postal code
                <input
                  required
                  minLength={3}
                  value={form.postalCode}
                  onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Postal code"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#171717] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.18)] transition hover:bg-[#2d2d2d] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Creating demo order..." : `Create demo order · ${formatCurrency(subtotal)}`}
            </button>
          </form>
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
