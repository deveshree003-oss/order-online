import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "../_lib/admin-auth";
import { getAdminProductPosts } from "../_lib/admin-product-posts";
import { deleteProductPostFormAction, markProductPostOverFormAction } from "./create-deal/product-post-actions";
import DeleteProductPostButton from "./delete-product-post-button";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, isAuthorized } = await getAdminSession();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAuthorized) {
    redirect("/admin/access-denied");
  }

  const { posts, errorMessage } = await getAdminProductPosts();

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Order Online</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Signed in as an authorized administrator</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-950/15"
              href="/admin/create-deal"
            >
              Create Deal
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Product posts</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Publish a new product deal</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Paste the original product message, upload an image, and let OrderOnline detect the product information for you.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
            href="/admin/create-deal"
          >
            Open Product Post workflow
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </section>
        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Published products</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Manage product posts</h2>
          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{errorMessage}</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No product posts have been published yet.</p>
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {posts.map((post) => (
                <div className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between" key={post.id}>
                  <div className="flex min-w-0 items-center gap-4">
                    <img alt="" className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-contain" src={post.image_url} />
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-bold text-slate-950">{post.product_name || "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">{post.status.toUpperCase()}{post.rating !== null ? ` · Rating ${post.rating}/5` : ""}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {post.status === "live" && <form action={markProductPostOverFormAction}><input name="postId" type="hidden" value={post.id} /><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-400" type="submit">Mark over</button></form>}
                    <DeleteProductPostButton deleteAction={deleteProductPostFormAction} postId={post.id} productName={post.product_name} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
