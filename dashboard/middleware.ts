import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // #region agent log
  fetch("http://127.0.0.1:7910/ingest/d3892d76-a7c6-4f9f-a942-5991539418d3", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "dc8607" },
    body: JSON.stringify({
      sessionId: "dc8607",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "dashboard/middleware.ts",
      message: "dashboard request received",
      data: { path: request.nextUrl.pathname, method: request.method },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
