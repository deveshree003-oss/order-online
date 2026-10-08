"use client";

interface SearchBarProps {
  value: string;
  onQueryChange: (value: string) => void;
}

export default function SearchBar({ value, onQueryChange }: SearchBarProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Search live deals</span>
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
        className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
        type="search"
        value={value}
        onInput={(event) => onQueryChange(event.currentTarget.value)}
        placeholder="Search products, brands, stores..."
      />
    </label>
  );
}
