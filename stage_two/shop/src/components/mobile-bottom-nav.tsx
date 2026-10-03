"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";

type NavigationIconName = "home" | "shop" | "bag" | "account";

const navigationItems: {
  label: string;
  href: string;
  icon: NavigationIconName;
}[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Shop", href: "/products", icon: "shop" },
  { label: "Bag", href: "/cart", icon: "bag" },
  { label: "Account", href: "/account", icon: "account" },
];

function NavigationIcon({ name }: { name: NavigationIconName }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="m3.5 10.5 8.5-7 8.5 7v9a1 1 0 0 1-1 1h-5.25v-6.25h-4.5v6.25H4.5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }

  if (name === "shop") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <rect x="4" y="4" width="6" height="6" rx="1.25" />
        <rect x="14" y="4" width="6" height="6" rx="1.25" />
        <rect x="4" y="14" width="6" height="6" rx="1.25" />
        <rect x="14" y="14" width="6" height="6" rx="1.25" />
      </svg>
    );
  }

  if (name === "bag") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M5 8.5h14l1 12H4z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function MobileBottomNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const { itemCount } = useCart();

  if (pathname === "/checkout" || pathname === "/signin") {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      {navigationItems.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`) ||
            (item.href === "/account" && pathname === "/signin");
        const href = item.href === "/account" && !isAuthenticated ? "/signin" : item.href;

        return (
          <Link
            key={item.label}
            href={href}
            className={`mobile-bottom-nav-link${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label === "Bag" && itemCount > 0 ? `Bag, ${itemCount} items` : item.label}
          >
            <span className="mobile-bottom-nav-icon">
              <NavigationIcon name={item.icon} />
              {item.label === "Bag" && itemCount > 0 ? (
                <span className="mobile-bottom-nav-count" aria-hidden="true">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}