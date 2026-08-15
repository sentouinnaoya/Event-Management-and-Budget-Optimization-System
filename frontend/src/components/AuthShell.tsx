import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Ticket, Users } from "lucide-react";
import { BrandMark } from "./ui";

const highlights = [
  {
    icon: Ticket,
    title: "Guests & registration",
    text: "Public registration pages and approval workflows for every event.",
  },
  {
    icon: Users,
    title: "Teams & vendors",
    text: "Organize staff, vendors, and tasks from one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Budget control",
    text: "Track spending live and get alerts before you go over budget.",
  },
];

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size="md" />
            <span className="text-lg font-semibold tracking-tight">EMBOS</span>
          </Link>
          <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight tracking-tight">
            Event management and budget optimization in one place.
          </h2>
          <p className="mt-3 max-w-md text-sm text-indigo-100">
            Plan events, control spending, manage guests and vendors, and stay
            on top of every detail.
          </p>
        </div>

        <ul className="relative space-y-4">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <li key={h.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-xs text-indigo-200">{h.text}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="relative text-xs text-indigo-200">
          © {new Date().getFullYear()} EMBOS · Event Management &amp; Budget
          Optimization System
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark size="md" />
            <span className="text-lg font-semibold text-slate-900">EMBOS</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
