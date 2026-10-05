import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  address: z.string().trim().min(8).max(500),
  city: z.string().trim().min(2).max(200),
  postalCode: z.string().trim().min(3).max(32),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(100).superRefine((items, context) => {
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      context.addIssue({ code: "custom", message: "Duplicate order items are not allowed." });
    }
  }),
});