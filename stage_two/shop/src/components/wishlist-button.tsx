"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "northstar-wishlist-v1";

export function WishlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
      setSaved(Array.isArray(stored) && stored.includes(productId));
    } catch {
      setSaved(false);
    }
  }, [productId]);

  const toggleSaved = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
      const savedProducts = Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string")
        : [];
      const next = saved
        ? savedProducts.filter((id) => id !== productId)
        : [...new Set([...savedProducts, productId])];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      setSaved(false);
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-button${saved ? " is-saved" : ""}`}
      onClick={toggleSaved}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved items" : "Save item"}
      title={saved ? "Remove from saved items" : "Save item"}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}