import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/bars/Navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pharmacy Management System",
  description: "A comprehensive pharmacy management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
            <Toaster />
          </CartProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}