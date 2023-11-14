import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCookies } from 'next-client-cookies/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const cookies = getCookies();

      const merchantId = cookies.get('merchant_id');
      const accessToken = cookies.get('access_token');

      if (merchantId == 'null' || !accessToken) {
        return NextResponse.redirect(new URL('https://sandbox.dev.clover.com/dashboard'))
      }

    } else {
      const merchantId = request.nextUrl.searchParams.get('merchant_id');
      const code = request.nextUrl.searchParams.get('code');

      if (merchantId && code) {
        return NextResponse.redirect(new URL(`/login?merchant_id=${merchantId}&code=${code}`, request.url))
      } else {
        return NextResponse.redirect(new URL('https://sandbox.dev.clover.com/dashboard'))
      }
    }
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/', '/dashboard']
}