import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CartItemSummary,
  CartLine,
  ProductSummary,
} from "@northstar/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiRequestError, hydrateCart, mutateCart } from "./api";

const CART_STORAGE_KEY = "northstar-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  items: CartItemSummary[];
  itemCount: number;
  subtotal: number;
  error: string | null;
  isLoading: boolean;
  isUpdating: boolean;
  addItem: (product: ProductSummary) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getCachedProduct: (productId: string) => ProductSummary | undefined;
};

const CartContext = createContext<CartContextValue | null>(null);

function parseSavedLines(value: string | null): CartLine[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved cart data is not a list.");
  }
  return parsed.flatMap((line): CartLine[] => {
    if (
      typeof line === "object" &&
      line !== null &&
      "productId" in line &&
      typeof line.productId === "string" &&
      "quantity" in line &&
      typeof line.quantity === "number" &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0 &&
      line.quantity <= 99
    ) {
      return [{ productId: line.productId, quantity: line.quantity }];
    }
    return [];
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const linesRef = useRef<CartLine[]>([]);
  const [items, setItems] = useState<CartItemSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cachedProducts, setCachedProducts] = useState<Record<string, ProductSummary>>({});
  const updateInFlight = useRef(false);

  const saveLines = useCallback(async (nextLines: CartLine[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextLines));
      linesRef.current = nextLines;
      setLines(nextLines);
      return true;
    } catch {
      setError("Your cart couldn't be saved on this device. Please try again.");
      return false;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const result = await hydrateCart(linesRef.current);
      setItems(result.items);
      setError(result.error);
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Unable to sync your cart. Your saved items are still here.",
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const savedLines = parseSavedLines(await AsyncStorage.getItem(CART_STORAGE_KEY));
        if (!mounted) return;
        linesRef.current = savedLines;
        setLines(savedLines);
        try {
          const result = await hydrateCart(savedLines);
          if (mounted) {
            setItems(result.items);
            setError(result.error);
          }
        } catch (requestError) {
          if (mounted) {
            setError(
              requestError instanceof ApiRequestError
                ? requestError.message
                : "Unable to sync your cart. Your saved items are still here.",
            );
          }
        }
      } catch {
        if (mounted) {
          setError("Saved cart data couldn't be read. Any saved items were left untouched.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback(async (
    operation: "add" | "set" | "remove",
    productId: string,
    quantity?: number,
    product?: ProductSummary,
  ) => {
    if (product) {
      setCachedProducts((current) => ({ ...current, [product.id]: product }));
    }
    if (updateInFlight.current || isLoading) return;
    const current = linesRef.current;
    const existing = current.find((line) => line.productId === productId)?.quantity ?? 0;
    const nextQuantity = operation === "add" ? existing + (quantity ?? 1) : quantity ?? 0;
    if (nextQuantity > 99) {
      setError("A product cannot be added more than 99 times.");
      return;
    }
    const nextLines = operation === "remove" || nextQuantity === 0
      ? current.filter((line) => line.productId !== productId)
      : [
        ...current.filter((line) => line.productId !== productId),
        { productId, quantity: nextQuantity },
      ];

    updateInFlight.current = true;
    setIsUpdating(true);
    if (!await saveLines(nextLines)) {
      updateInFlight.current = false;
      setIsUpdating(false);
      return;
    }
    setError(null);
    try {
      const result = await mutateCart({
        operation,
        productId,
        quantity: operation === "remove" ? undefined : nextQuantity,
        guestLines: current,
      });
      setItems(result.items);
      setError(result.error);
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Cart sync failed. Your changes are saved on this device.",
      );
    } finally {
      updateInFlight.current = false;
      setIsUpdating(false);
    }
  }, [isLoading, saveLines]);

  const addItem = useCallback(
    (product: ProductSummary) => update("add", product.id, 1, product),
    [update],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      update(quantity === 0 ? "remove" : "set", productId, quantity),
    [update],
  );

  const removeItem = useCallback(
    (productId: string) => update("remove", productId),
    [update],
  );

  const clearCart = useCallback(async () => {
    if (updateInFlight.current || isLoading || linesRef.current.length === 0) return;
    updateInFlight.current = true;
    setIsUpdating(true);
    setError(null);
    try {
      const result = await mutateCart({
        operation: "clear",
        guestLines: linesRef.current,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (await saveLines([])) setItems([]);
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Cart sync failed. Your saved items were not cleared.",
      );
    } finally {
      updateInFlight.current = false;
      setIsUpdating(false);
    }
  }, [isLoading, saveLines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    items,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal: items.reduce((total, item) => {
      const line = lines.find(({ productId }) => productId === item.id);
      return total + (line ? item.price * line.quantity : 0);
    }, 0),
    error,
    isLoading,
    isUpdating,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    getCachedProduct: (productId) => cachedProducts[productId],
  }), [
    addItem,
    cachedProducts,
    clearCart,
    error,
    isLoading,
    isUpdating,
    items,
    lines,
    refreshCart,
    removeItem,
    updateQuantity,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
