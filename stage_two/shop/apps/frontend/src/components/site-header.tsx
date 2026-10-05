"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

const navItems = [
  { label: "Shop all", href: "/products" },
  { label: "Home & Living", href: "/products?category=home-living" },
  { label: "Desk objects", href: "/products?category=desk-essentials" },
  { label: "Lighting", href: "/products?category=lighting" },
];

export function SiteHeader({
  user,
}: {
  user: { name?: string | null; email?: string | null } | null;
}) {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountLabel = user?.name?.trim() || user?.email || "Account";
  const isCheckout = pathname === "/checkout";

  return (
    <header className="store-header">
      <div className="announcement-bar">
        <p>Free delivery on orders over $100</p>
        <span>Thoughtfully chosen. Made to stay.</span>
      </div>
      <div className="header-main">
        <Link href="/" className="brand-lockup" aria-label="Northstar home">
          <span className="brand-mark">N</span>
          <span className="brand-wordmark">
            <span>northstar</span>
            <small>objects for the everyday</small>
          </span>
        </Link>

        {isCheckout ? (
          <div className="checkout-header-label" aria-label="Secure checkout">
            <span className="secure-indicator" /> Secure checkout
          </div>
        ) : (
          <>
            <nav aria-label="Main navigation" className="desktop-nav">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href}>
                 <p className="text-white">{item.label}</p> 
                </Link>
              ))}
            </nav>

            <div className="header-actions">
              <form action="/products" method="get" className="header-search">
                <label className="sr-only" htmlFor="header-search">Search products</label>
                <input id="header-search" name="q" type="search" placeholder="Search the collection" />
                <button type="submit" aria-label="Submit search">Search</button>
              </form>
              <Link href={user ? "/account" : "/signin"} className="header-account" title={user ? accountLabel : undefined}>
                {user ? accountLabel : "Sign in"}
              </Link>
              <Link href="/cart" className="header-cart">
                Bag <span>{itemCount}</span>
              </Link>
              <Link
                href="/cart"
                className={`mobile-header-cart${pathname === "/cart" ? " is-active" : ""}`}
                aria-label={itemCount > 0 ? `Bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Bag"}
                aria-current={pathname === "/cart" ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path d="M5 8.5h14l1 12H4z" />
                  <path d="M9 9V6a3 3 0 0 1 6 0v3" />
                </svg>
                {itemCount > 0 ? (
                  <span className="mobile-header-cart-count" aria-hidden="true">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                className="mobile-menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span />
                <span />
              </button>
            </div>
          </>
        )}
      </div>
      {isCheckout ? (
        <div className="checkout-header-footer">
          <Link href="/cart">← Back to bag</Link>
          <span>Encrypted checkout</span>
        </div>
      ) : null}
      <nav id="mobile-navigation" aria-label="Mobile navigation" className={`mobile-nav ${menuOpen ? "is-open" : ""}`}>
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href={user ? "/account" : "/signin"} onClick={() => setMenuOpen(false)}>
          {user ? accountLabel : "Sign in"}
        </Link>
        <Link href="/cart" onClick={() => setMenuOpen(false)}>Bag ({itemCount})</Link>
        <form action="/products" method="get" className="mobile-search">
          <label className="sr-only" htmlFor="mobile-search">Search products</label>
          <input id="mobile-search" name="q" type="search" placeholder="Search the collection" />
          <button type="submit">Search</button>
        </form>
      </nav>
    </header>
  );
}
