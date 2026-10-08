"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { ProductPost } from "../_lib/product-posts";
import { formatPrice } from "../_lib/formatters";
import { numericPrice } from "../_lib/pricing";
import ProductPostCard from "./product-post-card";
import Header from "./header";
import SearchBar from "./search-bar";

interface DealsHomepageProps {
  posts: ProductPost[];
  errorMessage: string | null;
}

export default function DealsHomepage({ posts, errorMessage }: DealsHomepageProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const closeDialogRef = useRef<HTMLButtonElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filters = ["All", ...new Set(posts.map((post) => post.platform).filter((value): value is string => Boolean(value)))];
  const featuredPost = posts[0];
  const visiblePosts = posts.filter((post) => {
    const matchesFilter = activeFilter === "All" || post.platform === activeFilter;
    const matchesQuery =
      !normalizedQuery ||
      [post.product_name, post.brand, post.platform, post.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesFilter && matchesQuery;
  });

  useEffect(() => {
    if (!isHowItWorksOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    closeDialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsHowItWorksOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isHowItWorksOpen]);

  return (
    <div id="top" className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Header onHowItWorks={() => setIsHowItWorksOpen(true)} searchValue={query} onSearchChange={setQuery} />
      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="hidden pt-5 sm:pt-6 md:block">
            <div className="rounded-2xl border border-slate-200 bg-[#f1f5f8] px-6 py-6 shadow-sm sm:px-8 sm:py-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-950">⚡ Before you order</p>
                  <p className="mt-3 text-base font-medium leading-7 text-slate-950">
                    Check available slots first <span className="mx-1 text-slate-400">•</span> Complete the Order Form <span className="mx-1 text-slate-400">•</span> Send your reference <span className="mx-1 text-slate-400">•</span> Follow deal instructions
                  </p>
                </div>
                <button className="inline-flex min-h-12 shrink-0 items-center self-start rounded-full border border-emerald-500 bg-[#10B981] px-5 text-sm font-bold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 lg:self-center" onClick={() => setIsHowItWorksOpen(true)} type="button">
                  How it works →
                </button>
              </div>
            </div>
          </section>

          <section className="relative mt-5 hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f1f5f8] px-5 py-10 shadow-sm sm:px-10 sm:py-14 md:block">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Curated for better buying</p>
                <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-6xl">Good deals. Clear prices.<br /><span className="text-emerald-500">Zero guesswork.</span></h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">Discover live product offers from trusted stores, with the original details and final prices clearly in view.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/25" href="#live-deals">Explore deals <span aria-hidden="true" className="ml-2">→</span></a>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" onClick={() => setIsHowItWorksOpen(true)} type="button">How it works</button>
                </div>
              </div>
              {featuredPost && (() => {
                const featuredOrderPrice = numericPrice(featuredPost.order_price);
                const featuredLessPrice = numericPrice(featuredPost.less_price);
                return (
                  <Link className="group relative block rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 transition hover:-translate-y-1 hover:shadow-2xl lg:justify-self-end" href={`/products/${featuredPost.id}`}>
                    <div className="flex aspect-[1.35/1] items-center justify-center overflow-hidden rounded-xl bg-[#f1f5f8] p-5">
                      <img alt={featuredPost.product_name || "Featured deal"} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" src={featuredPost.image_url} />
                    </div>
                    <div className="px-2 pb-2 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{featuredPost.platform || "Featured deal"}</p>
                      {featuredPost.product_name && <h2 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{featuredPost.product_name}</h2>}
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          {featuredOrderPrice !== null && <span className="text-xl font-black text-emerald-500">{formatPrice(featuredOrderPrice)}</span>}
                          {featuredLessPrice !== null && <p className="text-sm font-black uppercase tracking-[0.08em] text-emerald-700">Less price {formatPrice(featuredLessPrice)}</p>}
                        </div>
                        <span className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white">View deal →</span>
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>
          </section>

        <section id="live-deals" className="scroll-mt-6 py-6 sm:py-12">
          <div className="mb-6 md:hidden"><SearchBar value={query} onQueryChange={setQuery} /></div>
          <div className="hidden flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end md:flex">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Available now</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Live Deals</h2>
            </div>
            {visiblePosts.length > 0 && <p aria-live="polite" className="text-sm font-medium text-slate-600">
              {visiblePosts.length} {visiblePosts.length === 1 ? "deal" : "deals"} found
            </p>}
          </div>

          <div className="mt-5 hidden flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between md:flex">
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1" aria-label="Filter live deals by platform" role="group">
                {filters.map((filter) => (
                  <button
                    className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${activeFilter === filter ? "bg-slate-950 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950"}`}
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    type="button"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

          {errorMessage ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center sm:px-10">
              <h3 className="text-lg font-bold text-slate-950">Unable to load live deals</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{errorMessage}</p>
            </div>
          ) : visiblePosts.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
              {visiblePosts.map((post, index) => <ProductPostCard key={post.id} post={post} position={index + 1} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center sm:px-10">
              <h3 className="text-lg font-bold text-slate-950">No live deals right now</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                {normalizedQuery || activeFilter !== "All" ? "Try another search or platform filter." : "Please check back soon for new product deals."}
              </p>
              {(normalizedQuery || activeFilter !== "All") && (
                <button
                  className="mt-5 text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950"
                  onClick={() => { setQuery(""); setActiveFilter("All"); }}
                  type="button"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
        </div>

      </main>
      {isHowItWorksOpen && (
        <div
          aria-label="How DealNest works"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsHowItWorksOpen(false); }}
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Before you order</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">How it works</h2>
              </div>
              <button
                aria-label="Close how it works"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-600 transition hover:border-slate-400 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                onClick={() => setIsHowItWorksOpen(false)}
                ref={closeDialogRef}
                type="button"
              >
                ×
              </button>
            </div>
            <ol className="mt-6 space-y-4">
              {[
                ["01", "Check the deal"],
                ["02", "Check Order Form availability"],
                ["03", "Place your order only when a slot is available"],
                ["04", "Send your order reference on WhatsApp when required"],
                ["05", "Complete required forms and follow deal instructions"],
              ].map(([number, instruction]) => (
                <li className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0" key={number}>
                  <span className="text-sm font-black text-emerald-700">{number}</span>
                  <span className="text-sm font-semibold leading-6 text-slate-700">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
