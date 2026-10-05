import { createServer } from "node:http";
import { handleAuthRequest } from "./auth.ts";
import { getBackendEnvironment } from "./config/env.ts";
import { backendRoutes } from "./api/routes.ts";
import { getCategories, getProductBySlug, getProducts } from "./services/catalog.ts";
import { getCart, hydrateCart, mutateCart } from "./services/cart.ts";
import { checkoutSchema } from "./services/orders.ts";
import { getAuthenticatedSession } from "./services/auth.ts";

const env = getBackendEnvironment();
const port = Number(process.env.PORT ?? 4000);

function sendJson(response: import("node:http").ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function readJsonBody(request: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    request.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function readRequestBody(request: import("node:http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function toWebRequest(request: import("node:http").IncomingMessage, url: URL) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }

  const method = request.method ?? "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : await readRequestBody(request);
  return new Request(url, {
    method,
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

async function sendWebResponse(
  response: import("node:http").ServerResponse,
  webResponse: Response,
) {
  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, name) => {
    if (name !== "set-cookie") response.setHeader(name, value);
  });

  const cookies = webResponse.headers.getSetCookie();
  if (cookies.length > 0) response.setHeader("Set-Cookie", cookies);
  response.end(Buffer.from(await webResponse.arrayBuffer()));
}

function getStatusPayload() {
  return {
    name: "northstar-backend",
    phase: "api-enabled",
    status: "ok",
    environment: env.nodeEnv,
    routes: backendRoutes.length,
    port,
    owns: [
      "authentication",
      "database",
      "business-logic",
      "email-integration",
      "api-contracts",
    ],
  };
}

const server = createServer(async (request, response) => {
  const url = request.url ? new URL(request.url, `http://${request.headers.host ?? "localhost"}`) : null;

  if (!url) {
    sendJson(response, 400, { success: false, error: { code: "BAD_REQUEST", message: "Request URL is missing." } });
    return;
  }

  const { pathname, searchParams } = url;
  const method = request.method ?? "GET";
  const origin = request.headers.origin;
  const storefrontOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (origin === storefrontOrigin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type, X-Auth-Return-Redirect");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Vary", "Origin");
  }

  if (method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    try {
      const authResponse = await handleAuthRequest(await toWebRequest(request, url));
      await sendWebResponse(response, authResponse);
    } catch (error) {
      console.error("Auth request failed:", error instanceof Error ? error.message : "Unknown error");
      sendJson(response, 500, {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Authentication request failed." },
      });
    }
    return;
  }

  if (method === "GET" && pathname === "/") {
    sendJson(response, 200, {
      success: true,
      data: {
        name: "northstar-backend",
        phase: "api-enabled",
        message: "Northstar backend is running.",
        routes: backendRoutes.map((route) => ({
          method: route.method,
          path: route.path,
          authRequired: route.authRequired,
          description: route.description,
        })),
      },
    });
    return;
  }

  if (method === "GET" && pathname === "/health") {
    sendJson(response, 200, { success: true, data: getStatusPayload() });
    return;
  }

  if (method === "GET" && pathname === "/api/v1/products") {
    try {
      const products = await getProducts({
        categorySlug: searchParams.get("category") ?? undefined,
        search: searchParams.get("search") ?? undefined,
        limit: Number(searchParams.get("limit") ?? 3),
      });
      sendJson(response, 200, { success: true, data: products });
    } catch (error) {
      console.error("Catalog request failed:", error instanceof Error ? error.message : "Unknown error");
      sendJson(response, 500, { success: false, error: { code: "INTERNAL_ERROR", message: "Unable to load products." } });
    }
    return;
  }

  if (method === "GET" && pathname === "/api/v1/categories") {
    try {
      const categories = await getCategories();
      sendJson(response, 200, { success: true, data: categories });
    } catch (error) {
      console.error("Category request failed:", error instanceof Error ? error.message : "Unknown error");
      sendJson(response, 500, { success: false, error: { code: "INTERNAL_ERROR", message: "Unable to load categories." } });
    }
    return;
  }

  if (method === "GET" && pathname.startsWith("/api/v1/products/")) {
    try {
      const slug = decodeURIComponent(pathname.slice("/api/v1/products/".length));
      const product = await getProductBySlug(slug);
      if (!product) {
        sendJson(response, 404, { success: false, error: { code: "NOT_FOUND", message: "Product not found." } });
        return;
      }
      sendJson(response, 200, { success: true, data: product });
    } catch (error) {
      console.error("Product request failed:", error instanceof Error ? error.message : "Unknown error");
      sendJson(response, 500, { success: false, error: { code: "INTERNAL_ERROR", message: "Unable to load product." } });
    }
    return;
  }

  if (method === "GET" && pathname === "/api/v1/cart") {
    try {
      sendJson(response, 200, { success: true, data: await getCart(request.headers.cookie ?? null) });
    } catch {
      sendJson(response, 500, { success: false, error: { code: "INTERNAL_ERROR", message: "Unable to load cart." } });
    }
    return;
  }

  if (method === "POST" && pathname === "/api/v1/cart/hydrate") {
    try {
      const lines = await readJsonBody(request);
      const result = await hydrateCart(request.headers.cookie ?? null, lines);
      sendJson(response, 200, { success: true, data: result });
    } catch {
      sendJson(response, 400, { success: false, error: { code: "BAD_REQUEST", message: "Invalid cart data." } });
    }
    return;
  }

  if (method === "POST" && pathname === "/api/v1/cart/items") {
    try {
      const payload = await readJsonBody(request);
      const result = await mutateCart(request.headers.cookie ?? null, payload);
      sendJson(response, 200, { success: true, data: result });
    } catch {
      sendJson(response, 400, { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } });
    }
    return;
  }

  if (method === "GET" && pathname === "/api/v1/users/me") {
    const session = await getAuthenticatedSession(request.headers.cookie ?? null);
    if (!session) {
      sendJson(response, 401, { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      return;
    }

    sendJson(response, 200, { success: true, data: session });
    return;
  }

  if (method === "POST" && pathname === "/api/v1/orders") {
    try {
      const payload = checkoutSchema.safeParse(await readJsonBody(request));
      if (!payload.success) {
        sendJson(response, 400, { success: false, error: { code: "BAD_REQUEST", message: "Checkout details are invalid." } });
        return;
      }

      sendJson(response, 503, {
        success: false,
        error: {
          code: "PAYMENT_UNAVAILABLE",
          message: "Checkout is unavailable because payment processing is not configured. No order was placed.",
        },
      });
    } catch {
      sendJson(response, 400, { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } });
    }
    return;
  }

  sendJson(response, 404, {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${method} ${pathname}`,
    },
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Backend API listening on http://0.0.0.0:${port}`);
  console.log(`Health check: http://0.0.0.0:${port}/health`);
});

server.on("error", (error: Error & { code?: string }) => {
  console.error("Backend startup failed:", error.message);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  }
  process.exit(1);
});
