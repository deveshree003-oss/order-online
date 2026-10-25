"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProductPost } from "../_lib/product-posts";
import ProductPostCard from "./product-post-card";
import Header from "./header";

interface DealsHomepageProps {
  posts: ProductPost[];
  errorMessage: string | null;
}

export default function DealsHomepage({ posts, errorMessage }: DealsHomepageProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const closeDialogRef = useRef<HTMLButtonElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePosts = posts.filter((post) => {
    const searchableContent = [
      post.platform,
      post.description,
      post.order_price,
      post.less_price,
    ]
      .join(" ")
      .toLowerCase();

    return !normalizedQuery || searchableContent.includes(normalizedQuery);
  });
  const livePosts = visiblePosts.filter((post) => post.status === "live");
  const overPosts = visiblePosts.filter((post) => post.status === "over");

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

  useEffect(() => {
    const refreshTimer = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [router]);

  return (
    <div id="top" className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Header
        onHowItWorks={() => setIsHowItWorksOpen(true)}
        searchValue={query}
        onSearchChange={setQuery}
      />
      <main id="live-deals" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center sm:px-10">
            <h3 className="text-lg font-bold text-slate-950">Unable to load deals</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{errorMessage}</p>
          </div>
        ) : visiblePosts.length > 0 ? (
          <div className="space-y-8">
            {livePosts.length > 0 && (
              <section aria-labelledby="live-deals-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl" id="live-deals-heading">LIVE DEALS</h2>
                  <p className="text-xs font-medium text-slate-600 sm:text-sm">{livePosts.length} {livePosts.length === 1 ? "deal" : "deals"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
                  {livePosts.map((post, index) => (
                    <ProductPostCard key={post.id} post={post} position={index + 1} />
                  ))}
                </div>
              </section>
            )}
            {overPosts.length > 0 && (
              <section aria-labelledby="over-deals-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black tracking-tight text-slate-700 sm:text-2xl" id="over-deals-heading">OVER DEALS</h2>
                  <p className="text-xs font-medium text-slate-600 sm:text-sm">{overPosts.length} {overPosts.length === 1 ? "deal" : "deals"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
                  {overPosts.map((post, index) => (
                    <ProductPostCard key={post.id} post={post} position={livePosts.length + index + 1} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center sm:px-10">
            <h3 className="text-lg font-bold text-slate-950">No deals found</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
              {normalizedQuery ? "Try a different search." : "Please check back soon for new product deals."}
            </p>
            {normalizedQuery && (
              <button
                className="mt-4 text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950"
                onClick={() => setQuery("")}
                type="button"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </main>

      {isHowItWorksOpen && (
        <div
          aria-label="How SAMARTH DEALS works"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHowItWorksOpen(false);
          }}
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
