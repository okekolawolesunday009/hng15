"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { sendOrderConfirmation } from "@/app/checkout/actions";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/cart";

const checkoutSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please use a valid email address."),
  address: z.string().min(8, "Address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(3, "Postal code is required."),
});

export default function CheckoutPage() {
  const { items, subtotal, clearCart, error: cartError, isUpdating } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);
  const submissionLock = useRef(false);

  const total = useMemo(() => subtotal, [subtotal]);

  if (items.length === 0 && !submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Checkout</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] text-slate-900">Your cart is empty</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Add an item before continuing to checkout.
        </p>
        <Link
          href="/products"
          className="mt-8 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.18)] transition hover:bg-[#2d2d2d]"
        >
          <p className="text-white">Browse products</p>
        </Link>
      </main>
    );
  }

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLock.current) return;

    const result = checkoutSchema.safeParse({
      name: form.name,
      email: form.email,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
    });

    if (!result.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          nextErrors[field] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setCheckoutError(null);
    submissionLock.current = true;
    setIsSubmitting(true);
    try {
      const orderItems = items.map(({ id, quantity }) => ({ productId: id, quantity }));
      const cartCleared = await clearCart();

      if (!cartCleared) {
        setCheckoutError(cartError ?? "Your cart could not be cleared. The order was not placed.");
        return;
      }

      const emailSent = await sendOrderConfirmation({
        orderId: crypto.randomUUID(),
        name: result.data.name,
        email: result.data.email,
        items: orderItems,
      });
      setConfirmationEmailSent(emailSent);
      setSubmitted(true);
    } catch {
      setCheckoutError("We could not complete checkout. Please try again.");
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Order placed</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] text-slate-900">Thanks for your order</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
          {confirmationEmailSent
            ? `Your order confirmation was sent to ${form.email}.`
            : "Your order was placed, but we could not send the confirmation email. Please check your email address or contact us for help."}
        </p>
        <Link href="/products" className="mt-8 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.18)] transition hover:bg-[#2d2d2d]">
          <p className="text-white">Continue shopping</p>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[var(--content-width)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Checkout</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.05em] text-slate-900">Complete your order</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-[#e9decc] bg-white/80 p-6 shadow-[0_18px_45px_rgba(32,26,18,0.05)]">
          {checkoutError ? <p role="alert" className="text-sm text-red-700">{checkoutError}</p> : null}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              id="name"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">Street address</label>
            <input
              id="address"
              value={form.address}
              onChange={(event) => handleChange("address", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            {errors.address ? <p className="mt-2 text-sm text-red-600">{errors.address}</p> : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-2 block text-sm font-medium text-slate-700">City</label>
              <input
                id="city"
                value={form.city}
                onChange={(event) => handleChange("city", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              {errors.city ? <p className="mt-2 text-sm text-red-600">{errors.city}</p> : null}
            </div>

            <div>
              <label htmlFor="postalCode" className="mb-2 block text-sm font-medium text-slate-700">Postal code</label>
              <input
                id="postalCode"
                value={form.postalCode}
                onChange={(event) => handleChange("postalCode", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              {errors.postalCode ? <p className="mt-2 text-sm text-red-600">{errors.postalCode}</p> : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUpdating}
            className="w-full rounded-full bg-[#171717] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.18)] transition hover:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-white">{isSubmitting ? "Submitting..." : "Place order"}</span>
          </button>
        </form>

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
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
