"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { cartItems, carts } from "@/db/schema/carts";
import { categories } from "@/db/schema/categories";
import { products } from "@/db/schema/products";
import {
  applyCartLineMutation,
  isCartQuantityAvailable,
  type CartActionResult,
  type CartItem,
  type CartLine,
} from "@/lib/cart";

const cartLinesSchema = z.array(
  z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  }),
).max(100).superRefine((lines, context) => {
  const productIds = new Set<string>();
  lines.forEach((line, index) => {
    if (productIds.has(line.productId)) {
      context.addIssue({
        code: "custom",
        message: "Each product can appear only once.",
        path: [index, "productId"],
      });
    }
    productIds.add(line.productId);
  });
});

const mutationSchema = z.object({
  operation: z.enum(["add", "set", "remove", "clear"]),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(0).max(99).optional(),
  guestLines: cartLinesSchema,
});

type CartProductRecord = {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  isActive: boolean;
  quantity: number;
};

class CartActionError extends Error {}

function toCartItem(row: CartProductRecord): CartItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    stock: row.stock,
    imageUrl: row.imageUrl,
    categoryName: row.categoryName,
    isActive: row.isActive,
    quantity: row.quantity,
  };
}

function availabilityError(items: CartItem[]) {
  return items.some((item) => !item.isActive || !isCartQuantityAvailable(item.quantity, item.stock))
    ? "Some items are unavailable or exceed current stock. Update or remove them to continue."
    : null;
}

async function loadGuestCart(lines: CartLine[]): Promise<CartActionResult> {
  if (lines.length === 0) {
    return { items: [], error: null };
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
      isActive: products.isActive,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(products.id, lines.map((line) => line.productId)));

  const productsById = new Map(rows.map((row) => [row.id, row]));
  const items = lines.flatMap((line): CartItem[] => {
    const row = productsById.get(line.productId);
    return row ? [toCartItem({ ...row, quantity: line.quantity })] : [];
  });
  const hasMissingProduct = items.length !== lines.length;

  return {
    items,
    error: hasMissingProduct
      ? "Some cart products are no longer available."
      : availabilityError(items),
  };
}

async function loadUserCart(userId: string): Promise<CartActionResult> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
      isActive: products.isActive,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(carts.userId, userId));

  const items = rows.map(toCartItem);
  return { items, error: availabilityError(items) };
}

function safeError(error: unknown) {
  return error instanceof CartActionError
    ? error.message
    : "Unable to update your cart. Please try again.";
}

export async function hydrateCart(input: unknown): Promise<CartActionResult> {
  const parsedLines = cartLinesSchema.safeParse(input);
  if (!parsedLines.success) {
    return { items: [], error: "Saved cart data is invalid." };
  }

  const userId = (await auth())?.user?.id;
  if (!userId) {
    try {
      return await loadGuestCart(parsedLines.data);
    } catch {
      return { items: [], error: "Unable to load your cart. Please try again." };
    }
  }

  let mergeHadUnavailableItems = false;
  try {
    if (parsedLines.data.length > 0) {
      await db.transaction(async (tx) => {
        let [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
        if (!cart) {
          await tx.insert(carts).values({ userId }).onConflictDoNothing();
          [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
        }
        if (!cart) {
          throw new CartActionError("Unable to create your cart.");
        }

        for (const line of parsedLines.data) {
          const [product] = await tx
            .select({ stock: products.stock, isActive: products.isActive })
            .from(products)
            .where(eq(products.id, line.productId))
            .for("update");
          if (!product || !product.isActive || !isCartQuantityAvailable(line.quantity, product.stock)) {
            mergeHadUnavailableItems = true;
            continue;
          }

          const [existing] = await tx
            .select({ quantity: cartItems.quantity })
            .from(cartItems)
            .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, line.productId)))
            .limit(1);
          const quantity = Math.max(existing?.quantity ?? 0, line.quantity);
          if (!isCartQuantityAvailable(quantity, product.stock)) {
            mergeHadUnavailableItems = true;
            continue;
          }

          await tx
            .insert(cartItems)
            .values({ cartId: cart.id, productId: line.productId, quantity })
            .onConflictDoUpdate({
              target: [cartItems.cartId, cartItems.productId],
              set: { quantity, updatedAt: new Date() },
            });
        }
      });
    }

    const result = await loadUserCart(userId);
    return {
      ...result,
      error: mergeHadUnavailableItems
        ? "Some saved items were unavailable and were not added."
        : result.error,
    };
  } catch {
    return { items: [], error: "Unable to load your saved cart. Please try again." };
  }
}

export async function mutateCart(input: unknown): Promise<CartActionResult> {
  const parsed = mutationSchema.safeParse(input);
  if (!parsed.success) {
    return { items: [], error: "Cart update was invalid." };
  }

  const mutation = parsed.data;
  const userId = (await auth())?.user?.id;
  if (!userId) {
    if (mutation.operation === "clear") {
      return { items: [], error: null };
    }

    try {
      const current = await loadGuestCart(mutation.guestLines);
      const transition = applyCartLineMutation(
        mutation.guestLines,
        mutation.operation,
        mutation.productId,
        mutation.quantity,
      );
      if (transition.error) {
        return { ...current, error: transition.error };
      }

      const updated = await loadGuestCart(transition.lines);
      const changedItem = updated.items.find((item) => item.id === mutation.productId);
      if (
        (mutation.operation === "add" || (mutation.operation === "set" && mutation.quantity !== 0)) &&
        (!changedItem || !changedItem.isActive || !isCartQuantityAvailable(changedItem.quantity, changedItem.stock))
      ) {
        return { ...current, error: "Requested quantity exceeds available stock." };
      }
      return updated;
    } catch {
      return { items: [], error: "Unable to update your cart. Please try again." };
    }
  }

  try {
    if (mutation.operation === "clear") {
      const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      if (cart) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
      return { items: [], error: null };
    }

    if (!mutation.productId) {
      return { ...(await loadUserCart(userId)), error: "Choose a valid product." };
    }

    await db.transaction(async (tx) => {
      const [product] = await tx
        .select({ stock: products.stock, isActive: products.isActive })
        .from(products)
        .where(eq(products.id, mutation.productId!))
        .for("update");

      const isRemoving = mutation.operation === "remove" ||
        (mutation.operation === "set" && mutation.quantity === 0);
      if (!isRemoving && (!product || !product.isActive || product.stock < 1)) {
        throw new CartActionError("This product is unavailable.");
      }

      let [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      if (!cart) {
        await tx.insert(carts).values({ userId }).onConflictDoNothing();
        [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      }
      if (!cart) {
        throw new CartActionError("Unable to create your cart.");
      }

      const [existing] = await tx
        .select({ quantity: cartItems.quantity })
        .from(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, mutation.productId!)))
        .limit(1);
      const transition = applyCartLineMutation(
        existing ? [{ productId: mutation.productId!, quantity: existing.quantity }] : [],
        mutation.operation,
        mutation.productId,
        mutation.quantity,
      );
      if (transition.error) {
        throw new CartActionError(transition.error);
      }

      const quantity = transition.lines[0]?.quantity ?? 0;

      if (quantity === 0) {
        await tx
          .delete(cartItems)
          .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, mutation.productId!)));
        return;
      }

      if (!product || !isCartQuantityAvailable(quantity, product.stock)) {
        throw new CartActionError("Requested quantity exceeds available stock.");
      }

      await tx
        .insert(cartItems)
        .values({ cartId: cart.id, productId: mutation.productId!, quantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.productId],
          set: { quantity, updatedAt: new Date() },
        });
    });

    return await loadUserCart(userId);
  } catch (error) {
    try {
      return { ...(await loadUserCart(userId)), error: safeError(error) };
    } catch {
      return { items: [], error: safeError(error) };
    }
  }
}