import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "../components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EMBOS - Event Management & Budget Optimization",
  description:
    "Plan, organize, execute, and monitor events while managing budgets efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          richColors
          position="bottom-center"
          duration={3000}
          closeButton
        />
      </body>
    </html>
  );
}
