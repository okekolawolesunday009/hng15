"use server";

import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema/products";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";

const orderEmailSchema = z.object({
  orderId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(100).superRefine((items, context) => {
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      context.addIssue({ code: "custom", message: "Duplicate order items are not allowed." });
    }
  }),
});

export async function sendOrderConfirmation(input: unknown) {
  const parsed = orderEmailSchema.safeParse(input);
  if (!parsed.success) {
    return false;
  }

  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        isActive: products.isActive,
      })
      .from(products)
      .where(inArray(products.id, parsed.data.items.map((item) => item.productId)));

    if (rows.length !== parsed.data.items.length) {
      return false;
    }

    const productById = new Map(rows.map((product) => [product.id, product]));
    const items = parsed.data.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product || !product.isActive || item.quantity > product.stock) {
        throw new Error("An order item is unavailable.");
      }
      return { name: product.name, price: Number(product.price), quantity: item.quantity };
    });

    return await sendOrderConfirmationEmail({
      orderId: parsed.data.orderId,
      name: parsed.data.name,
      email: parsed.data.email,
      items,
    });
  } catch {
    console.error("[mailgun] Order confirmation could not be prepared.");
    return false;
  }
}