"use client";

import { useCart } from "@/components/cart-provider";
import type { CatalogProduct } from "@/lib/catalog";

export function AddToCartButton({
  product,
  compact = false,
}: {
  product: CatalogProduct;
  compact?: boolean;
}) {
  const { addItem, error, isUpdating } = useCart();

  return (
    <div>
      <button
        type="button"
        onClick={() => addItem(product.id)}
        disabled={isUpdating || product.stock < 1}
        className={`button-lime${compact ? " button-compact" : ""}`}
      >
        {product.stock < 1 ? "Out of stock" : isUpdating ? "Updating..." : "Add to cart"}
      </button>
      {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
