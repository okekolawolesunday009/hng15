"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCartFromStorage,
  getCartItemCount,
  getCartSubtotal,
  saveCartToStorage,
  type CartItem,
} from "@/lib/cart";

type CartActionResult = { items: CartItem[]; error: string | null };

async function requestCart(path: string, body: unknown): Promise<CartActionResult> {
  const response = await fetch(`/api/backend/v1/cart/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Cart request failed.");

  const payload = await response.json() as { success?: boolean; data?: CartActionResult };
  if (!payload.success || !payload.data || !Array.isArray(payload.data.items)) {
    throw new Error("Cart response was invalid.");
  }
  return payload.data;
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
  isUpdating: boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | null;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const storedLines = getCartFromStorage();

    void requestCart("hydrate", storedLines).then((result) => {
      if (!isCurrent) {
        return;
      }

      setItems(result.items);
      setError(result.error);
      setIsLoading(false);
    }).catch(() => {
      if (isCurrent) {
        setError("Unable to load your cart. Please try again.");
        setIsLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(userId ? [] : items);
    }
  }, [items, isLoading, userId]);

  const runMutation = async (
    operation: "add" | "set" | "remove" | "clear",
    productId?: string,
    quantity?: number,
  ) => {
    setError(null);
    setIsUpdating(true);
    try {
      const result = await requestCart("items", {
        operation,
        productId,
        quantity,
        guestLines: items.map(({ id, quantity: itemQuantity }) => ({
          productId: id,
          quantity: itemQuantity,
        })),
      });
      setError(result.error);
      if (result.error) {
        return false;
      }

      setItems(result.items);
      return true;
    } catch {
      setError("Unable to update your cart. Please try again.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const addItem = (productId: string, quantity = 1) => {
    void runMutation("add", productId, quantity);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    void runMutation("set", productId, quantity);
  };

  const removeItem = (productId: string) => {
    void runMutation("remove", productId);
  };

  const clearCart = () => {
    return runMutation("clear");
  };

  const value: CartContextValue = {
    items,
    itemCount: getCartItemCount(items),
    subtotal: getCartSubtotal(items),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    error,
    isLoading,
    isUpdating,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
