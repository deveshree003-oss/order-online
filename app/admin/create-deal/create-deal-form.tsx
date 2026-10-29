"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import {
  getOrderFormPostStatus,
  getJayShakthiOrderFormUrl,
  type OrderFormSlotAvailability,
} from "../../_lib/order-form-slots";
import { createSupabaseBrowserClient } from "../../_lib/supabase-browser";
import {
  extractProductUrls,
  parseProductPostMessage,
  type ProductPostMetadata,
} from "../../_lib/product-post-parser";
import type { AdminProductPost } from "../../_lib/admin-product-posts";
import { createProductPostAction, updateProductPostAction } from "./product-post-actions";
import { initialCreateDealState, normalizeCreateDealState } from "./state";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;
const emptyMetadata: ProductPostMetadata = {
  productName: "",
  brand: "",
  platform: "",
  orderPrice: "",
  lessPrice: "",
  rating: "",
};

function numericText(value: string) {
  return value.replace(/[^0-9.-]/g, "");
}

function normalizedUrl(value: string) {
  try {
    const url = new URL(value.trim().replace(/[),.;!?]+$/, ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      (url.port === "80" && url.protocol === "http:") ||
      (url.port === "443" && url.protocol === "https:")
    ) {
      url.port = "";
    }
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    url.searchParams.sort();
    return url.toString();
  } catch {
    return null;
  }
}

export default function CreateDealForm({
  post,
  posts = [],
  onSaved,
}: {
  post?: AdminProductPost;
  posts?: AdminProductPost[];
  onSaved?: () => void;
}) {
  const isEditing = Boolean(post);
  const [state, formAction, isPending] = useActionState(
    isEditing ? updateProductPostAction : createProductPostAction,
    initialCreateDealState,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [description, setDescription] = useState(post?.description ?? "");
  const [metadata, setMetadata] = useState<ProductPostMetadata>(() => ({
    productName: post?.product_name ?? "",
    brand: post?.brand ?? "",
    platform: post?.platform ?? "",
    orderPrice: post?.order_price == null ? "" : String(post.order_price),
    lessPrice: post?.less_price == null ? "" : String(post.less_price),
    rating: post?.rating == null ? "" : String(post.rating),
  }));
  const [selectedStatus, setSelectedStatus] = useState<"draft" | "live" | "over">(post?.status ?? "live");
  const [imageUrl, setImageUrl] = useState(post?.image_url ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(post?.image_url ?? null);
  const [uploadState, setUploadState] = useState(post ? "ready" : "idle");
  const [detectionState, setDetectionState] = useState<"idle" | "detecting" | "ready">("idle");
  const [slotAvailability, setSlotAvailability] = useState<OrderFormSlotAvailability | null>(null);
  const [slotDetectionState, setSlotDetectionState] = useState<"idle" | "checking" | "ready" | "unavailable">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const publishButtonRef = useRef<HTMLButtonElement>(null);
  const detectionRequestRef = useRef(0);
  const slotRequestRef = useRef(0);
  const slotAutoStatusAppliedRef = useRef(false);
  const safeState = normalizeCreateDealState(state);
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  const editingPostId = post?.id;
  const submittedUrls = extractProductUrls(description)
    .map(normalizedUrl)
    .filter((url): url is string => Boolean(url));
  const duplicatePost = posts.find((candidate) => {
    if (candidate.id === post?.id) return false;
    const existingUrls = extractProductUrls(candidate.description)
      .map(normalizedUrl)
      .filter((url): url is string => Boolean(url));
    return submittedUrls.some((url) => existingUrls.includes(url));
  });

  const resetFormState = useCallback(() => {
    formRef.current?.reset();
    setDescription("");
    setMetadata(emptyMetadata);
    setSelectedStatus("live");
    setImageUrl("");
    setPreviewUrl(null);
    setUploadState("idle");
    setDetectionState("idle");
    setSlotAvailability(null);
    setSlotDetectionState("idle");
    slotAutoStatusAppliedRef.current = false;
    setClientError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    const formUrl = getJayShakthiOrderFormUrl(description);
    const requestId = slotRequestRef.current + 1;
    slotRequestRef.current = requestId;

    if (!formUrl) {
      const resetTimer = window.setTimeout(() => {
        if (slotRequestRef.current !== requestId) return;
        setSlotAvailability(null);
        setSlotDetectionState("idle");
        if (slotAutoStatusAppliedRef.current) setSelectedStatus(post?.status ?? "live");
        slotAutoStatusAppliedRef.current = false;
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();
    const requestedFormUrl = formUrl;

    async function checkOrderFormSlots() {
      try {
        const response = await fetch(
          `/api/product-post-slots?url=${encodeURIComponent(requestedFormUrl)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          if (slotRequestRef.current === requestId) {
            setSlotDetectionState("unavailable");
          }
          return;
        }

        const result = (await response.json()) as {
          slots: OrderFormSlotAvailability | null;
        };
        if (slotRequestRef.current !== requestId) return;

        const status = getOrderFormPostStatus(result.slots);
        if (!status || !result.slots) {
          setSlotDetectionState("unavailable");
          return;
        }

        setSlotAvailability(result.slots);
        if (post?.status !== "draft") {
          setSelectedStatus(status);
          slotAutoStatusAppliedRef.current = true;
        }
        setSlotDetectionState("ready");
      } catch {
        if (!controller.signal.aborted && slotRequestRef.current === requestId) {
          setSlotDetectionState("unavailable");
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (slotRequestRef.current !== requestId) return;
      setSlotAvailability(null);
      setSlotDetectionState("checking");
      if (slotAutoStatusAppliedRef.current) setSelectedStatus(post?.status ?? "live");
      slotAutoStatusAppliedRef.current = false;
      void checkOrderFormSlots();
    }, 350);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [description, post?.status]);

  useEffect(() => {
    if (!safeState.successMessage || isEditing) return;
    const resetTimer = window.setTimeout(resetFormState, 0);
    return () => window.clearTimeout(resetTimer);
  }, [isEditing, resetFormState, safeState.successMessage]);

  useEffect(() => {
    if (!safeState.successMessage || !isEditing) return;
    onSaved?.();
  }, [isEditing, onSaved, safeState.successMessage]);

  useEffect(() => {
    if (!editingPostId) return;
    const timer = window.setTimeout(() => {
      captionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      captionRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editingPostId]);

  async function uploadImage(file: File) {
    setClientError(null);
    if (!acceptedTypes.includes(file.type)) {
      setClientError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxImageSize) {
      setClientError("Images must be 5 MB or smaller.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    if (!storageBucket) {
      setUploadState("missing-config");
      setClientError("Image upload is unavailable until NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET is configured.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setClientError("Your session has expired. Please sign in again.");
      return;
    }

    const { data: adminUser, error: authorizationError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (authorizationError || !adminUser) {
      setClientError("You are not authorized to upload product images.");
      return;
    }

    setUploadState("uploading");
    const path = `admin-products/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from(storageBucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setUploadState("error");
      setClientError(`Image upload failed: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploadState("ready");
  }

  function updateDescription(nextDescription: string) {
    setDescription(nextDescription);
    const requestId = detectionRequestRef.current + 1;
    detectionRequestRef.current = requestId;

    if (!nextDescription.trim()) {
      setMetadata(emptyMetadata);
      setDetectionState("idle");
      return;
    }

    setDetectionState("detecting");
    window.setTimeout(() => {
      if (detectionRequestRef.current !== requestId) return;
      setMetadata(parseProductPostMessage(nextDescription));
      setDetectionState("ready");
    }, 0);
  }

  const hasImage = Boolean(imageUrl);
  const hasDescription = Boolean(description.trim());

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-8"
      onSubmit={(event) => {
        if (event.nativeEvent.submitter !== publishButtonRef.current) event.preventDefault();
      }}
    >
      {(clientError || safeState.errorMessage) && <p aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{clientError || safeState.errorMessage}</p>}
      {safeState.successMessage && <p aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{safeState.successMessage}</p>}
      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="productImage">Product image</label>
        <button
          className="mt-2 flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 text-center transition hover:border-emerald-500 hover:bg-emerald-50/30 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void uploadImage(file); }}
          type="button"
        >
          {previewUrl ? <img alt="Selected product preview" className="h-36 max-w-full rounded-xl object-contain" src={previewUrl} /> : <span className="text-4xl">&#128444;</span>}
          <span className="mt-3 text-base font-semibold text-slate-800">{uploadState === "uploading" ? "Uploading image..." : "Drag a product image here"}</span>
          <span className="mt-1 text-sm text-slate-500">or tap to choose from your phone</span>
        </button>
        <input ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="sr-only" id="productImage" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} type="file" />
        <input name="imageUrl" type="hidden" value={imageUrl} />
        {!storageBucket && <p className="mt-2 text-xs font-medium text-amber-700">Uploads are disabled until a Supabase Storage bucket is configured.</p>}
        {safeState.fieldErrors.imageUrl && <p className="mt-2 text-xs font-medium text-rose-700">{safeState.fieldErrors.imageUrl}</p>}
      </div>

      {post && <input name="postId" type="hidden" value={post.id} />}

      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="details">Original product description</label>
        <textarea
          ref={captionRef}
          className="mt-2 min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          id="details"
          name="details"
          required
          placeholder="Paste the product links or details here (brand, code, platform, price, mediator, links...)"
          onChange={(event) => {
            updateDescription(event.target.value);
          }}
          value={description}
        />
        {duplicatePost && (
          <p aria-live="polite" className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            ⚠️ Duplicate product/order link found! This link already exists in another product ({duplicatePost.id}).
          </p>
        )}
        {safeState.fieldErrors.details && <p className="mt-2 text-xs font-medium text-rose-700">{safeState.fieldErrors.details}</p>}
      </div>

      <fieldset className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <legend className="px-1 text-sm font-black uppercase tracking-[0.12em] text-slate-800">Detected information</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {([
            ["productName", "Product name", metadata.productName, "text"],
            ["brand", "Brand", metadata.brand, "text"],
            ["platform", "Platform", metadata.platform, "text"],
            ["orderPrice", "Order price", metadata.orderPrice, "number"],
            ["lessPrice", "Less price", metadata.lessPrice, "number"],
            ["rating", "Platform rating", metadata.rating, "number"],
          ] as const).map(([name, label, value, type]) => (
            <label className="text-sm font-bold text-slate-800" htmlFor={name} key={name}>
              <span className="flex items-center justify-between gap-3">{label}<span className={`text-[10px] font-black uppercase tracking-wider ${value ? "text-emerald-700" : "text-slate-400"}`}>{value ? "✓ Detected" : "— Not found"}</span></span>
              <input
                className="mt-2 h-8 w-full border-0 bg-transparent px-0 text-sm font-semibold text-slate-900 outline-none focus:ring-0"
                id={name}
                min={type === "number" ? "0" : undefined}
                name={name}
                onChange={(event) => setMetadata((current) => ({ ...current, [name]: type === "number" ? numericText(event.target.value) : event.target.value }))}
                step={type === "number" ? "0.01" : undefined}
                type={type}
                value={value}
              />
              {safeState.fieldErrors[name] && <span className="mt-1 block text-xs font-medium text-rose-700">{safeState.fieldErrors[name]}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="text-sm font-bold text-slate-800">Status</p>
        <input name="status" type="hidden" value={selectedStatus} />
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          <button aria-pressed={selectedStatus === "draft"} className={`h-11 rounded-xl text-xs font-extrabold tracking-[0.12em] transition ${selectedStatus === "draft" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500"}`} onClick={() => { slotAutoStatusAppliedRef.current = false; setSelectedStatus("draft"); }} type="button">DRAFT</button>
          <button aria-pressed={selectedStatus === "live"} className={`h-11 rounded-xl text-xs font-extrabold tracking-[0.12em] transition ${selectedStatus === "live" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500"}`} onClick={() => { slotAutoStatusAppliedRef.current = false; setSelectedStatus("live"); }} type="button">LIVE · Available now</button>
          <button aria-pressed={selectedStatus === "over"} className={`h-11 rounded-xl text-xs font-extrabold tracking-[0.12em] transition ${selectedStatus === "over" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"}`} onClick={() => { slotAutoStatusAppliedRef.current = false; setSelectedStatus("over"); }} type="button">OVER · Ended</button>
        </div>
        {safeState.fieldErrors.status && <p className="mt-2 text-xs font-medium text-rose-700">{safeState.fieldErrors.status}</p>}
        {detectionState === "detecting" && <p aria-live="polite" className="mt-2 text-xs font-medium text-slate-500">Detecting product details…</p>}
        {slotDetectionState === "checking" && <p aria-live="polite" className="mt-2 text-xs font-medium text-slate-500">Checking order-form slots to choose a status…</p>}
        {slotDetectionState === "ready" && slotAvailability && <div aria-live="polite" className="mt-2 text-xs font-medium text-emerald-700">
          <p>Order-form availability detected. Status was automatically selected; you can still change it manually.</p>
          <ul className="mt-1 flex flex-wrap gap-x-3">
            {slotAvailability.slots.map((slot) => <li key={slot.dealType}>{slot.dealType}: {slot.availableSlots} {slot.availableSlots === 1 ? "slot" : "slots"}</li>)}
          </ul>
        </div>}
        {slotDetectionState === "unavailable" && <p aria-live="polite" className="mt-2 text-xs font-medium text-amber-700">Slots could not be counted for this order link. Choose LIVE or OVER manually.</p>}
      </div>

      <button ref={publishButtonRef} className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-base font-extrabold uppercase text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-950/20 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending || uploadState === "uploading" || slotDetectionState === "checking" || !hasImage || !hasDescription} type="submit">{isPending ? (isEditing ? "Saving changes..." : "Publishing product...") : (isEditing ? "Save Changes" : "Publish Product")}</button>
    </form>
  );
}
