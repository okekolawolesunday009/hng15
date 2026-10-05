import "server-only";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const forwardedHeaders = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "x-auth-return-redirect",
] as const;

export async function proxyBackendRequest(request: Request, backendPath: string) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(backendPath, backendUrl);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers();
  for (const name of forwardedHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method;
  const body = method === "GET" || method === "HEAD"
    ? undefined
    : await request.arrayBuffer();
  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, name) => {
    if (name.toLowerCase() !== "set-cookie") {
      responseHeaders.append(name, value);
    }
  });
  for (const cookie of upstreamResponse.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
