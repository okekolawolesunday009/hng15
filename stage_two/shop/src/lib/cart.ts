export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
  categoryName?: string | null;
};

export type CartItem = CartProduct & {
  quantity: number;
  stock: number;
  isActive: boolean;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartOperation = "add" | "set" | "remove" | "clear";

export type CartLineMutationResult = {
  lines: CartLine[];
  error: string | null;
};

export type CartActionResult = {
  items: CartItem[];
  error: string | null;
};

export const CART_STORAGE_KEY = "northstar-cart-v1";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function getCartFromStorage(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item): CartLine[] => {
      if (
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99
      ) {
        return [{ productId: item.id, quantity: item.quantity }];
      }

      if (
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        typeof item.productId === "string" &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99
      ) {
        return [{ productId: item.productId, quantity: item.quantity }];
      }

      return [];
    });
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity }))),
  );
}

export function isCartQuantityAvailable(quantity: number, stock: number) {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= stock;
}

export function applyCartLineMutation(
  currentLines: CartLine[],
  operation: CartOperation,
  productId?: string,
  quantity?: number,
): CartLineMutationResult {
  if (operation === "clear") {
    return { lines: [], error: null };
  }

  if (!productId) {
    return { lines: currentLines, error: "Choose a valid product." };
  }

  if (operation === "remove" || (operation === "set" && quantity === 0)) {
    return {
      lines: currentLines.filter((line) => line.productId !== productId),
      error: null,
    };
  }

  if (!Number.isInteger(quantity) || !quantity || quantity < 1) {
    return { lines: currentLines, error: "Requested quantity is invalid." };
  }

  const existingQuantity = currentLines.find((line) => line.productId === productId)?.quantity ?? 0;
  const nextQuantity = operation === "add" ? existingQuantity + quantity : quantity;
  if (nextQuantity > 99) {
    return { lines: currentLines, error: "Requested quantity is invalid." };
  }

  return {
    lines: [
      ...currentLines.filter((line) => line.productId !== productId),
      { productId, quantity: nextQuantity },
    ],
    error: null,
  };
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
