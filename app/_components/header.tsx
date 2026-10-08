"use client";

import { useState } from "react";

interface HeaderProps {
  onHowItWorks: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function Header({
  onHowItWorks,
  searchValue,
  onSearchChange,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 py-2 sm:gap-6">

          {/* Logo */}
          <a
            className="shrink-0 text-xl font-black tracking-[-0.04em] text-slate-950"
            href="#top"
            onClick={() => setIsMenuOpen(false)}
          >
            Deal<span className="text-emerald-500">Nest</span>
          </a>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex"
          >
            <a
              className="text-slate-950 transition hover:text-emerald-600"
              href="#live-deals"
            >
              Deals
            </a>

            <button
              className="transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              onClick={onHowItWorks}
              type="button"
            >
              How it works →
            </button>
          </nav>

          {/* Desktop Search */}
          <label className="relative ml-auto hidden min-w-0 max-w-sm flex-1 md:block">
            <span className="sr-only">Search live deals</span>

            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="6" />
              <path strokeLinecap="round" d="m20 20-4.35-4.35" />
            </svg>

            <input
              className="h-10 w-full rounded-full border border-slate-200 bg-[#f6f7fb] py-2 pl-10 pr-4 text-xs text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              type="search"
              value={searchValue}
              onInput={(event) =>
                onSearchChange(event.currentTarget.value)
              }
              placeholder="Search products, brands, stores..."
            />
          </label>

          {/* Desktop Admin */}
          <a
            aria-label="Open admin"
            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 sm:inline-flex"
            href="/admin"
          >
            <span aria-hidden="true" className="text-lg">
              ♙
            </span>

            <span className="hidden lg:inline">
              Admin
            </span>
          </a>

          {/* Mobile Admin Icon */}
          <a
            aria-label="Open admin"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950 sm:hidden"
            href="/admin"
          >
            <span aria-hidden="true" className="text-lg">
              ♙
            </span>
          </a>

          {/* Mobile Menu Button */}
          <button
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 sm:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            {isMenuOpen ? (
              <span className="text-xl leading-none">×</span>
            ) : (
              <span className="text-xl leading-none">☰</span>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-slate-100 py-4 sm:hidden">
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-2"
            >

              {/* Deals */}
              <a
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                href="#live-deals"
                onClick={() => setIsMenuOpen(false)}
              >
                Deals
              </a>

              {/* How it works */}
              <button
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => {
                  setIsMenuOpen(false);
                  onHowItWorks();
                }}
                type="button"
              >
                How it works →
              </button>

              {/* Admin */}
              <a
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                href="/admin"
              >
                Admin
              </a>

              {/* Mobile Search */}
              <label className="relative mt-2 block">
                <span className="sr-only">
                  Search live deals
                </span>

                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="6" />
                  <path
                    strokeLinecap="round"
                    d="m20 20-4.35-4.35"
                  />
                </svg>

                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#f6f7fb] py-2 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  type="search"
                  value={searchValue}
                  onInput={(event) =>
                    onSearchChange(event.currentTarget.value)
                  }
                  placeholder="Search products, brands, stores..."
                />
              </label>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}