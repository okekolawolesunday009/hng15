import { proxyBackendRequest } from "@/lib/backend-proxy";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const isCartMutation = path[0] === "v1"
    && path[1] === "cart"
    && ["hydrate", "items"].includes(path[2] ?? "")
    && path.length === 3;
  const isOrderSubmission = path[0] === "v1"
    && path[1] === "orders"
    && path.length === 2;

  if (!isCartMutation && !isOrderSubmission) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "API route not found." } },
      { status: 404 },
    );
  }

  const encodedPath = path.map(encodeURIComponent).join("/");
  return proxyBackendRequest(request, `/api/${encodedPath}`);
}
