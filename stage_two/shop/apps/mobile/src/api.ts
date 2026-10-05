import Constants from "expo-constants";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  CartData,
  CartLine,
  CartMutationRequest,
  CartItemSummary,
  CheckoutRequest,
  MobileAuthData,
  ProductSummary,
  UserSummary,
} from "@northstar/shared";

export type Category = { id: string; name: string; slug: string };

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function getDevelopmentHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri?.split(":")[0] || "localhost";
}

const developmentHost = getDevelopmentHost();
const backendUrl = (
  process.env.EXPO_PUBLIC_BACKEND_URL ?? `http://${developmentHost}:4000`
).replace(/\/+$/, "");
const storefrontUrl = (
  process.env.EXPO_PUBLIC_STOREFRONT_URL ?? `http://${developmentHost}:3000`
).replace(/\/+$/, "");
let mobileAccessToken: string | null = null;

export function setMobileAccessToken(token: string | null) {
  mobileAccessToken = token;
}

export function resolveImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  try {
    return new URL(imageUrl, `${storefrontUrl}/`).toString();
  } catch {
    throw new ApiRequestError("The product image URL is invalid.");
  }
}

async function request<T>(path: string, init?: RequestInit, authenticated = true): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    response = await fetch(`${backendUrl}${path}`, {
      ...init,
      credentials: "omit",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(authenticated && mobileAccessToken
          ? { Authorization: `Bearer ${mobileAccessToken}` }
          : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError("Can't reach the shop right now. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiRequestError("The shop returned an invalid response.", response.status);
  }

  if (!response.ok) {
    const errorPayload = payload as Partial<ApiErrorResponse>;
    throw new ApiRequestError(
      errorPayload.error?.message ?? "The shop request failed. Please try again.",
      response.status,
      errorPayload.error?.code,
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    throw new ApiRequestError("The shop returned an invalid response.", response.status);
  }

  return (payload as ApiSuccessResponse<T>).data;
}

export async function exchangeGoogleIdToken(idToken: string) {
  return request<MobileAuthData>(
    "/api/v1/auth/mobile/google",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
    false,
  );
}

export async function getCurrentUser() {
  const session = await request<{ user: UserSummary; authenticated: true }>("/api/v1/users/me");
  return session.user;
}

export async function revokeMobileSession() {
  await request<{ signedOut: true }>("/api/v1/auth/mobile/logout", { method: "POST" });
}

export async function getCategories() {
  return request<Category[]>("/api/v1/categories");
}

export async function getProducts(options: { category?: string; search?: string } = {}) {
  const params = new URLSearchParams({ limit: "100" });
  if (options.category) params.set("category", options.category);
  if (options.search?.trim()) params.set("search", options.search.trim());
  const products = await request<ProductSummary[]>(`/api/v1/products?${params.toString()}`);
  return products.map((product) => ({
    ...product,
    imageUrl: resolveImageUrl(product.imageUrl),
  }));
}

export async function getProduct(slug: string) {
  const product = await request<ProductSummary>(
    `/api/v1/products/${encodeURIComponent(slug)}`,
  );
  return { ...product, imageUrl: resolveImageUrl(product.imageUrl) };
}

export async function hydrateCart(lines: CartLine[]) {
  const result = await request<CartData>("/api/v1/cart/hydrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lines),
  });
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      imageUrl: resolveImageUrl(item.imageUrl),
    })),
  };
}

export async function mutateCart(mutation: CartMutationRequest) {
  const result = await request<CartData>("/api/v1/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mutation),
  });
  return {
    ...result,
    items: result.items.map((item: CartItemSummary) => ({
      ...item,
      imageUrl: resolveImageUrl(item.imageUrl),
    })),
  };
}

export async function submitCheckout(checkout: CheckoutRequest) {
  return request<never>("/api/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkout),
  });
}
