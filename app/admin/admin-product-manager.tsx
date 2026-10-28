"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AdminProductPost } from "../_lib/admin-product-posts";
import CreateDealForm from "./create-deal/create-deal-form";
import DeleteProductPostButton from "./delete-product-post-button";
import {
  deleteProductPostFormAction,
  setProductPostStatusAction,
} from "./create-deal/product-post-actions";

function StatusButton({
  postId,
  status,
}: {
  postId: string;
  status: "live" | "over";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateStatus() {
    startTransition(async () => {
      const result = await setProductPostStatusAction(postId, status);
      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        return;
      }
      setErrorMessage(null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
        disabled={isPending}
        onClick={updateStatus}
        type="button"
      >
        {isPending ? "Updating..." : status === "over" ? "Mark over" : "Mark live"}
      </button>
      {errorMessage && <span className="w-full text-xs text-rose-700">{errorMessage}</span>}
    </>
  );
}

export default function AdminProductManager({
  posts,
  errorMessage,
}: {
  posts: AdminProductPost[];
  errorMessage: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const editingPost = posts.find((post) => post.id === editingPostId) ?? null;
  const matchesSearch = useCallback((post: AdminProductPost) => {
    if (!normalizedQuery) return true;
    return [
      post.description,
      post.platform,
      post.order_price,
      post.less_price,
      post.image_url,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  }, [normalizedQuery]);
  const livePosts = useMemo(
    () => posts.filter((post) => post.status === "live" && matchesSearch(post)),
    [matchesSearch, posts],
  );
  const overPosts = useMemo(
    () => posts.filter((post) => post.status === "over" && matchesSearch(post)),
    [matchesSearch, posts],
  );
  const draftPosts = useMemo(
    () => posts.filter((post) => post.status === "draft" && matchesSearch(post)),
    [matchesSearch, posts],
  );
  const onSaved = useCallback(() => {
    setEditingPostId(null);
    router.refresh();
  }, [router]);

  function renderProducts(products: AdminProductPost[]) {
    return products.map((post) => (
      <div
        className="flex flex-col gap-4 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
        key={post.id}
      >
        <div className="flex min-w-0 items-center gap-4">
          <img
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-contain"
            src={post.image_url}
          />
          <div className="min-w-0">
            <p className="line-clamp-2 whitespace-pre-wrap text-sm font-medium text-slate-900">
              {post.description}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {post.platform || "Platform not detected"}
              {post.order_price !== null ? ` · Order ${post.order_price}` : ""}
              {post.less_price !== null ? ` · Less ${post.less_price}` : ""}
              {` · ${post.id}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={() => {
              setEditingPostId(post.id);
              window.setTimeout(() => {
                document.getElementById("publish-product-form")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 0);
            }}
            type="button"
          >
            Edit
          </button>
          {post.status === "live" ? (
            <StatusButton postId={post.id} status="over" />
          ) : (
            <StatusButton postId={post.id} status="live" />
          )}
          <DeleteProductPostButton
            deleteAction={deleteProductPostFormAction}
            postId={post.id}
            productName={null}
          />
        </div>
      </div>
    ));
  }

  const matchCount = livePosts.length + overPosts.length + draftPosts.length;

  return (
    <>
      <section
        className="mt-8 scroll-mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
        id="publish-product-form"
      >
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Publish</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">
          {editingPost ? "Edit product" : "Publish a new deal"}
        </h2>
        {editingPost && (
          <button
            className="mt-2 text-sm font-bold text-slate-600 underline underline-offset-4 hover:text-slate-950"
            onClick={() => setEditingPostId(null)}
            type="button"
          >
            Cancel editing
          </button>
        )}
        <div className="mt-5">
          <CreateDealForm
            key={editingPost?.id ?? "new-product"}
            onSaved={onSaved}
            post={editingPost ?? undefined}
            posts={posts}
          />
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Published products</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">Manage products</h2>
        <label className="relative mt-5 block w-full">
          <span className="sr-only">Search managed products</span>
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
            className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] py-3 pl-12 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 hover:border-emerald-300 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search captions, links, platforms or prices..."
            type="search"
            value={query}
          />
        </label>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{errorMessage}</p>
        ) : matchCount === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            {normalizedQuery ? "No products found." : "No product posts have been published yet."}
          </p>
        ) : (
          <div className="mt-6">
            {livePosts.length > 0 && (
              <section>
                <h3 className="border-b border-slate-100 pb-2 text-sm font-black uppercase tracking-wide text-emerald-700">Live Deals</h3>
                {renderProducts(livePosts)}
              </section>
            )}
            {overPosts.length > 0 && (
              <section className="mt-6">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-black uppercase tracking-wide text-slate-600">Over Deals</h3>
                {renderProducts(overPosts)}
              </section>
            )}
            {draftPosts.length > 0 && (
              <section className="mt-6">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-black uppercase tracking-wide text-amber-700">Drafts</h3>
                {renderProducts(draftPosts)}
              </section>
            )}
          </div>
        )}
      </section>
    </>
  );
}
