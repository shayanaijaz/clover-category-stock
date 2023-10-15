import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {

    const merchantId = request.nextUrl.searchParams.get('merchant_id');
    const code = request.nextUrl.searchParams.get('code');

    return NextResponse.redirect(new URL(`/login?merchant_id=${merchantId}&code=${code}`, request.url))
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/',
}