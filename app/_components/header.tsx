"use client";

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
  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            <span className="text-emerald-600">SAMARTH</span> DEALS
          </h1>
          <nav aria-label="Primary navigation" className="flex items-center gap-4 text-sm font-semibold">
            <a className="text-slate-700 transition hover:text-emerald-700" href="#live-deals">
              Deals
            </a>
            <button
              className="text-slate-700 transition hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              onClick={onHowItWorks}
              type="button"
            >
              How it works
            </button>
            <a className="text-slate-700 transition hover:text-emerald-700" href="/admin">
              Admin
            </a>
          </nav>
        </div>
        <label className="relative mt-4 block w-full">
          <span className="sr-only">Search deals</span>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="6" />
            <path strokeLinecap="round" d="m20 20-4.35-4.35" />
          </svg>
          <input
            className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] py-3 pl-12 pr-4 text-sm text-slate-950 shadow-[0_0_0_1px_rgba(16,185,129,0.03)] outline-none transition placeholder:text-slate-500 hover:border-emerald-300 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.14)] sm:h-14 sm:text-base"
            type="search"
            value={searchValue}
            onInput={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Search deals, prices or products..."
          />
        </label>
      </div>
    </header>
  );
}
