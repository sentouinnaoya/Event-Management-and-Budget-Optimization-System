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
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-indigo-900 p-12 text-slate-50 lg:flex">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 select-none font-display text-[26rem] leading-none text-white/[0.04]"
        >
          E
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"
        />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-display text-sm font-semibold text-white">
              E
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">EMBOS</span>
          </Link>
          <h2 className="mt-12 max-w-md text-3xl font-medium leading-tight">
            Event management and budget optimization in one place.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-200/90">
            Plan events, control spending, manage guests and vendors, and stay
            on top of every detail.
          </p>
        </div>

        <ul className="relative space-y-5">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <li key={h.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-indigo-100">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-50">{h.title}</p>
                  <p className="text-xs leading-relaxed text-indigo-200/80">{h.text}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="relative text-xs text-indigo-200/70">
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
