import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const origin = request.headers.get("origin") ?? "none";
  const auth = request.headers.get("authorization");
  const contentType = request.headers.get("content-type") ?? "none";
  console.log(
    `[req-log] ${new Date().toISOString()} ${method} ${pathname} origin=${origin} ct=${contentType} auth=${auth ? "Bearer " + auth.slice(7, 30) + "..." : "none"}`
  );
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
