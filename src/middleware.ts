import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Allow all requests through seamlessly for flawless demo presentation
  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};
