"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SystemStatus from "./SystemStatus";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Paper portfolio" },
  { href: "/learn", label: "Learn the terms" },
];

export default function Header() {
  const path = usePathname();
  return (
    <header className="border-b border-rule bg-panel">
      <p className="bg-ink px-4 py-2 text-center text-xs text-paper">
        Educational demo with hypothetical money. Nothing here is financial advice, and no real trades are placed.
      </p>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
            Paper Tape
          </Link>
          <div className="mt-1">
            <SystemStatus />
          </div>
        </div>
        <nav aria-label="Main">
          <ul className="flex gap-1">
            {LINKS.map((l) => {
              const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`block border-b-2 px-3 py-2 text-sm ${active ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
