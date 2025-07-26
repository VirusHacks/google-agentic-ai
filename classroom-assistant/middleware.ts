import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")

  // Always redirect from root to /presentation
  // if (request.nextUrl.pathname === "/") {
  //   return NextResponse.redirect(new URL("/presentation", request.url))
  // }

  // Allow auth pages to be accessed without authentication
  if (isAuthPage) {
    return NextResponse.next()
  }

  // Allow API routes to pass through
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Add routes that should be processed by middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
