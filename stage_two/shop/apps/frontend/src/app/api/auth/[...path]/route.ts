import { proxyBackendRequest } from "@/lib/backend-proxy";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handleAuthProxy(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  return proxyBackendRequest(request, `/api/auth/${encodedPath}`);
}

export { handleAuthProxy as GET, handleAuthProxy as POST };
