import { createSupabaseServerClient } from "./supabase-server.ts";
import { classifySupabaseError, logSupabaseError } from "./supabase-error.ts";
import { cleanProductTitle, deriveProductNameFromUrl, extractProductUrls, inferProductNameFromMessage, isValidProductName, parseProductPostMessage, platformFromUrl } from "./product-post-parser.ts";

export type AdminProductPost = {
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
  status: "draft" | "live" | "over";
  created_at: string;
  updated_at: string;
};

export type AdminProductPostsResult = {
  posts: AdminProductPost[];
  errorMessage: string | null;
};

const baseSelect = "id, image_url, description, status, created_at, updated_at";
const metadataSelect = "id, image_url, description, product_name, brand, platform, order_price, less_price, status, created_at, updated_at, published_at, rating";

async function normalizePost(row: Record<string, unknown>): Promise<AdminProductPost> {
  const description = String(row.description);
  const parsed = parseProductPostMessage(description);
  const urls = extractProductUrls(description);
  const productUrl = urls.find((url) => platformFromUrl(url)) ?? urls[0];
  const storedNameCandidate = typeof row.product_name === "string" ? cleanProductTitle(row.product_name) : "";
  const storedName = isValidProductName(storedNameCandidate) ? storedNameCandidate : "";
  const localName =
    storedName ||
    parsed.productName ||
    deriveProductNameFromUrl(productUrl ?? "") ||
    inferProductNameFromMessage(description);
  return {
    id: String(row.id),
    image_url: String(row.image_url),
    description,
    product_name: localName || null,
    brand: typeof row.brand === "string" ? row.brand : null,
    platform: typeof row.platform === "string" ? row.platform : parsed.platform || null,
    order_price: typeof row.order_price === "number" || typeof row.order_price === "string" ? row.order_price : null,
    less_price: typeof row.less_price === "number" || typeof row.less_price === "string" ? row.less_price : null,
    rating: validRating(row.rating),
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    status: row.status === "live" || row.status === "over" ? row.status : "draft",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function validRating(value: unknown) {
  const rating = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null;
}

function userFacingError(error: unknown) {
  const category = classifySupabaseError(error);
  if (category === "missing-table") return "The product_posts table is missing. Review and apply 20261002_create_product_posts.sql.";
  if (category === "rls") return "Supabase denied access to product_posts. Verify the active-admin RLS policy and your signed-in session.";
  if (category === "network") return "Supabase could not be reached. Verify NEXT_PUBLIC_SUPABASE_URL and network connectivity.";
  return "Product posts could not be loaded. Check the Supabase error details in the server log.";
}

export async function getAdminProductPosts(): Promise<AdminProductPostsResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const primary = await supabase
      .from("product_posts")
      .select(metadataSelect)
      .order("created_at", { ascending: false });
    let rows: unknown[] = (primary.data ?? []) as unknown[];
    let queryError: unknown = primary.error;

    if (queryError && classifySupabaseError(queryError) === "missing-column") {
      logSupabaseError("Product post metadata columns are unavailable; using base product_posts columns.", queryError, "warn");
      const fallback = await supabase
        .from("product_posts")
        .select(baseSelect)
        .order("created_at", { ascending: false });
      rows = (fallback.data ?? []) as unknown[];
      queryError = fallback.error;
    }

    if (queryError) {
      logSupabaseError("Unable to load admin product posts.", queryError);
      return { posts: [], errorMessage: userFacingError(queryError) };
    }

    return { posts: await Promise.all(rows.map((row) => normalizePost(row as Record<string, unknown>))), errorMessage: null };
  } catch (error) {
    logSupabaseError("Unable to load admin product posts.", error);
    return {
      posts: [],
      errorMessage: userFacingError(error),
    };
  }
}
