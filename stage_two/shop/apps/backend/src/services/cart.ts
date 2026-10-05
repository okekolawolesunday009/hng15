import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import { cartItems, carts } from "../db/schema/carts.ts";
import { categories } from "../db/schema/categories.ts";
import { products } from "../db/schema/products.ts";
import { getAuthenticatedSession } from "./auth.ts";

export type CartLine = { productId: string; quantity: number };
export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  isActive: boolean;
  quantity: number;
};
export type CartActionResult = { items: CartItem[]; error: string | null };

const cartLinesSchema = z.array(z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
})).max(100).superRefine((lines, context) => {
  if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
    context.addIssue({ code: "custom", message: "Each product can appear only once." });
  }
});

const mutationSchema = z.object({
  operation: z.enum(["add", "set", "remove", "clear"]),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(0).max(99).optional(),
  guestLines: cartLinesSchema.default([]),
});

const cartSelection = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  stock: products.stock,
  imageUrl: products.imageUrl,
  categoryName: categories.name,
  isActive: products.isActive,
};

function formatItems(rows: Array<typeof cartSelection extends never ? never : {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  isActive: boolean;
  quantity: number;
}>): CartItem[] {
  return rows.map((row) => ({ ...row, price: Number(row.price) }));
}

function available(quantity: number, stock: number) {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= stock;
}

function checkAvailability(items: CartItem[]) {
  return items.some((item) => !item.isActive || !available(item.quantity, item.stock))
    ? "Some items are unavailable or exceed current stock. Update or remove them to continue."
    : null;
}

async function loadGuestCart(lines: CartLine[]): Promise<CartActionResult> {
  if (lines.length === 0) return { items: [], error: null };

  const rows = await db
    .select({ ...cartSelection, quantity: products.stock })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(products.id, lines.map((line) => line.productId)));
  const productsById = new Map(rows.map((row) => [row.id, row]));
  const items = formatItems(lines.flatMap((line) => {
    const product = productsById.get(line.productId);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  }));

  return {
    items,
    error: items.length !== lines.length
      ? "Some cart products are no longer available."
      : checkAvailability(items),
  };
}

async function loadUserCart(userId: string): Promise<CartActionResult> {
  const rows = await db
    .select({ ...cartSelection, quantity: cartItems.quantity })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(carts.userId, userId));
  const items = formatItems(rows);
  return { items, error: checkAvailability(items) };
}

async function getIdentity(cookie: string | null) {
  const session = await getAuthenticatedSession(cookie);
  return session?.user.id ?? null;
}

export async function hydrateCart(cookie: string | null, input: unknown): Promise<CartActionResult> {
  const parsed = cartLinesSchema.safeParse(input);
  if (!parsed.success) return { items: [], error: "Saved cart data is invalid." };

  const userId = await getIdentity(cookie);
  if (!userId) {
    try {
      return await loadGuestCart(parsed.data);
    } catch {
      return { items: [], error: "Unable to load your cart. Please try again." };
    }
  }

  let unavailableItems = false;
  try {
    if (parsed.data.length > 0) {
      await db.transaction(async (tx) => {
        let [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
        if (!cart) {
          await tx.insert(carts).values({ userId }).onConflictDoNothing();
          [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
        }
        if (!cart) throw new Error("Unable to create your cart.");

        for (const line of parsed.data) {
          const [product] = await tx
            .select({ stock: products.stock, isActive: products.isActive })
            .from(products)
            .where(eq(products.id, line.productId))
            .for("update");
          if (!product || !product.isActive || !available(line.quantity, product.stock)) {
            unavailableItems = true;
            continue;
          }

          const [existing] = await tx
            .select({ quantity: cartItems.quantity })
            .from(cartItems)
            .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, line.productId)))
            .limit(1);
          const quantity = Math.max(existing?.quantity ?? 0, line.quantity);
          if (!available(quantity, product.stock)) {
            unavailableItems = true;
            continue;
          }

          await tx.insert(cartItems)
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
      error: unavailableItems ? "Some saved items were unavailable and were not added." : result.error,
    };
  } catch {
    return { items: [], error: "Unable to load your saved cart. Please try again." };
  }
}

function applyMutation(lines: CartLine[], operation: string, productId?: string, quantity?: number) {
  if (operation === "clear") return { lines: [], error: null };
  if (!productId) return { lines, error: "Choose a valid product." };
  if (operation === "remove" || (operation === "set" && quantity === 0)) {
    return { lines: lines.filter((line) => line.productId !== productId), error: null };
  }
  if (!Number.isInteger(quantity) || !quantity || quantity < 1) {
    return { lines, error: "Requested quantity is invalid." };
  }
  const existing = lines.find((line) => line.productId === productId)?.quantity ?? 0;
  const nextQuantity = operation === "add" ? existing + quantity : quantity;
  if (nextQuantity > 99) return { lines, error: "Requested quantity is invalid." };
  return {
    lines: [...lines.filter((line) => line.productId !== productId), { productId, quantity: nextQuantity }],
    error: null,
  };
}

export async function mutateCart(cookie: string | null, input: unknown): Promise<CartActionResult> {
  const parsed = mutationSchema.safeParse(input);
  if (!parsed.success) return { items: [], error: "Cart update was invalid." };
  const mutation = parsed.data;
  const userId = await getIdentity(cookie);

  if (!userId) {
    if (mutation.operation === "clear") return { items: [], error: null };
    try {
      const current = await loadGuestCart(mutation.guestLines);
      const transition = applyMutation(mutation.guestLines, mutation.operation, mutation.productId, mutation.quantity);
      if (transition.error) return { ...current, error: transition.error };
      const updated = await loadGuestCart(transition.lines);
      const changedItem = updated.items.find((item) => item.id === mutation.productId);
      if ((mutation.operation === "add" || (mutation.operation === "set" && mutation.quantity !== 0)) &&
        (!changedItem || !changedItem.isActive || !available(changedItem.quantity, changedItem.stock))) {
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
      if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      return { items: [], error: null };
    }
    const productId = mutation.productId;
    if (!productId) return { ...(await loadUserCart(userId)), error: "Choose a valid product." };

    await db.transaction(async (tx) => {
      const [product] = await tx.select({ stock: products.stock, isActive: products.isActive })
        .from(products).where(eq(products.id, productId)).for("update");
      const removing = mutation.operation === "remove" || (mutation.operation === "set" && mutation.quantity === 0);
      if (!removing && (!product || !product.isActive || product.stock < 1)) throw new Error("This product is unavailable.");

      let [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      if (!cart) {
        await tx.insert(carts).values({ userId }).onConflictDoNothing();
        [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      }
      if (!cart) throw new Error("Unable to create your cart.");

      const [existing] = await tx.select({ quantity: cartItems.quantity }).from(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId))).limit(1);
      const transition = applyMutation(
        existing ? [{ productId, quantity: existing.quantity }] : [],
        mutation.operation,
        productId,
        mutation.quantity,
      );
      if (transition.error) throw new Error(transition.error);
      const quantity = transition.lines[0]?.quantity ?? 0;
      if (quantity === 0) {
        await tx.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
        return;
      }
      if (!product || !available(quantity, product.stock)) throw new Error("Requested quantity exceeds available stock.");
      await tx.insert(cartItems).values({ cartId: cart.id, productId, quantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.productId],
          set: { quantity, updatedAt: new Date() },
        });
    });
    return await loadUserCart(userId);
  } catch (error) {
    return {
      ...(await loadUserCart(userId).catch(() => ({ items: [], error: null }))),
      error: error instanceof Error ? error.message : "Unable to update your cart. Please try again.",
    };
  }
}

export async function getCart(cookie: string | null) {
  const userId = await getIdentity(cookie);
  if (!userId) return { items: [], error: null } satisfies CartActionResult;
  return loadUserCart(userId);
}
