import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "../components/providers";

const inter = localFont({
  src: [
    { path: "./fonts/inter-400.ttf", weight: "400" },
    { path: "./fonts/inter-500.ttf", weight: "500" },
    { path: "./fonts/inter-600.ttf", weight: "600" },
    { path: "./fonts/inter-700.ttf", weight: "700" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-400.ttf", weight: "400" },
    { path: "./fonts/fraunces-500.ttf", weight: "500" },
    { path: "./fonts/fraunces-600.ttf", weight: "600" },
  ],
  variable: "--font-fraunces",
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
      <body className={`${inter.variable} ${fraunces.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
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
