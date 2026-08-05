import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/providers";

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
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
