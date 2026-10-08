import { createPublicSupabaseClient } from "./supabase";
import { getJayShakthiOrderFormSlots, type OrderFormSlotAvailability } from "./order-form-slots";
import { cleanProductTitle, deriveProductNameFromUrl, inferProductNameFromMessage, isValidProductName, nullablePrice, parseProductPostMessage, platformFromUrl, extractProductUrls } from "./product-post-parser";

export type ProductPost = {
  id: string;
  image_url: string;
  description: string;
  product_name: string | null;
  brand: string | null;
  platform: string | null;
  order_price: number | string | null;
  less_price: number | string | null;
  rating: number | string | null;
  published_at: string | null;
  status: "live" | "over";
  created_at: string;
  updated_at: string;
  order_form_slots: OrderFormSlotAvailability | null;
};

export type ProductPostsResult = {
  posts: ProductPost[];
  errorMessage: string | null;
};

const baseSelect = "id, image_url, description, status, created_at, updated_at";
const metadataSelect = "id, image_url, description, product_name, brand, platform, order_price, less_price, status, created_at, updated_at, published_at, rating";

type SupabaseQueryError = { code?: string; message?: string } | null;

function missingOptionalProductPostSchema(error: SupabaseQueryError) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "PGRST204" || error?.code === "PGRST205" || error?.code === "42P01" || message.includes("product_name") || message.includes("published_at") || message.includes("rating") || message.includes("relation") && message.includes("product_posts");
}

async function normalizePost(row: Record<string, unknown>): Promise<ProductPost> {
  const description = String(row.description);
  const parsed = parseProductPostMessage(description);
  const urls = extractProductUrls(description);
  const productUrl = urls.find((url) => platformFromUrl(url)) ?? urls[0];
  const storedNameCandidate = typeof row.product_name === "string" ? cleanProductTitle(row.product_name) : "";
  const storedName = isValidProductName(storedNameCandidate) ? storedNameCandidate : "";
  const localName =
    storedName ||
    parsed.productName ||
    inferProductNameFromMessage(description) ||
    deriveProductNameFromUrl(productUrl ?? "");
  const storedLessPrice = typeof row.less_price === "number" || typeof row.less_price === "string" ? row.less_price : null;
  return {
    id: String(row.id),
    image_url: String(row.image_url),
    description,
    product_name: localName || null,
    brand: typeof row.brand === "string" ? row.brand : null,
    platform: typeof row.platform === "string" ? row.platform : parsed.platform || (productUrl ? platformFromUrl(productUrl) : null) || null,
    order_price: typeof row.order_price === "number" || typeof row.order_price === "string" ? row.order_price : null,
    less_price: storedLessPrice ?? nullablePrice(parsed.lessPrice),
    rating: validRating(row.rating),
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    status: row.status === "over" ? "over" : "live",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    order_form_slots: await getJayShakthiOrderFormSlots(description),
  };
}

function validRating(value: unknown) {
  const rating = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null;
}

export async function getPublishedProductPosts(): Promise<ProductPostsResult> {
  try {
    const supabase = createPublicSupabaseClient();
    const primary = await supabase
      .from("product_posts")
      .select(metadataSelect)
      .eq("status", "live")
      .order("created_at", { ascending: false });
    let rows: unknown[] = (primary.data ?? []) as unknown[];
    let error = primary.error as SupabaseQueryError;

    if (error && missingOptionalProductPostSchema(error)) {
      const fallback = await supabase
        .from("product_posts")
        .select(baseSelect)
        .eq("status", "live")
        .order("created_at", { ascending: false });
      rows = (fallback.data ?? []) as unknown[];
      error = fallback.error as SupabaseQueryError;
    }

    if (error) return { posts: [], errorMessage: null };

    return { posts: await Promise.all(rows.map((row) => normalizePost(row as Record<string, unknown>))), errorMessage: null };
  } catch {
    return { posts: [], errorMessage: null };
  }
}

export async function getPublishedProductPost(id: string): Promise<ProductPost | null> {
  try {
    const supabase = createPublicSupabaseClient();
    const primary = await supabase
      .from("product_posts")
      .select(metadataSelect)
      .eq("id", id)
      .in("status", ["live", "over"])
      .maybeSingle();
    let row: unknown | null = primary.data as unknown | null;
    let error = primary.error as SupabaseQueryError;

    if (error && missingOptionalProductPostSchema(error)) {
      const fallback = await supabase
        .from("product_posts")
        .select(baseSelect)
        .eq("id", id)
        .in("status", ["live", "over"])
        .maybeSingle();
      row = fallback.data as unknown | null;
      error = fallback.error as SupabaseQueryError;
    }

    return error || !row ? null : await normalizePost(row as Record<string, unknown>);
  } catch {
    return null;
  }
}
