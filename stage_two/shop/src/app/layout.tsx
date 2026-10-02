import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { auth } from "@/auth";
import { CartProvider } from "@/components/cart-provider";
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
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, email: session.user.email }
    : null;

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <CartProvider userId={session?.user?.id ?? null}>
          <SiteHeader user={user} />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
