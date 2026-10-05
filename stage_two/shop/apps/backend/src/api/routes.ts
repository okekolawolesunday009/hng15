import { z } from "zod";

export const apiRouteSchema = z.object({
  method: z.enum(["GET", "POST", "PATCH", "DELETE"]),
  path: z.string(),
  authRequired: z.boolean().default(false),
  description: z.string(),
});

export type ApiRoute = z.infer<typeof apiRouteSchema>;

export const backendRoutes: ApiRoute[] = [
  {
    method: "POST",
    path: "/api/v1/auth/mobile/google",
    authRequired: false,
    description: "Exchange a verified Google ID token for a revocable native session.",
  },
  {
    method: "POST",
    path: "/api/v1/auth/mobile/logout",
    authRequired: true,
    description: "Revoke the current native session.",
  },
  {
    method: "GET",
    path: "/api/v1/products",
    authRequired: false,
    description: "List active products with optional filtering.",
  },
  {
    method: "GET",
    path: "/api/v1/products/:slug",
    authRequired: false,
    description: "Fetch a single active product by slug.",
  },
  {
    method: "GET",
    path: "/api/v1/categories",
    authRequired: false,
    description: "List product categories.",
  },
  {
    method: "GET",
    path: "/api/v1/cart",
    authRequired: false,
    description: "Fetch the current user's cart, or an empty guest cart.",
  },
  {
    method: "POST",
    path: "/api/v1/cart/hydrate",
    authRequired: false,
    description: "Hydrate a guest cart and merge it into the signed-in user's cart.",
  },
  {
    method: "POST",
    path: "/api/v1/cart/items",
    authRequired: false,
    description: "Validate and add, update, remove, or clear cart items.",
  },
  {
    method: "GET",
    path: "/api/v1/users/me",
    authRequired: true,
    description: "Fetch the authenticated user session.",
  },
  {
    method: "POST",
    path: "/api/v1/orders",
    authRequired: false,
    description: "Validate checkout input and reject while payment processing is not configured.",
  },
];

export function getBackendRoutes() {
  return backendRoutes;
}
