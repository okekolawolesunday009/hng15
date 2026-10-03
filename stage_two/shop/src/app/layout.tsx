import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { auth } from "@/auth";
import { CartProvider } from "@/components/cart-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Northstar | Objects for the everyday",
  description: "Considered pieces for a softer, more intentional everyday.",
  applicationName: "Northstar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Northstar",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, email: session.user.email }
    : null;

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-slate-50 text-slate-900">
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV !== "production"}
          cacheOnNavigation={false}
          options={{ scope: "/" }}
        >
          <CartProvider userId={session?.user?.id ?? null}>
            <SiteHeader user={user} />
            {children}
            <MobileBottomNav isAuthenticated={Boolean(session?.user)} />
          </CartProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
