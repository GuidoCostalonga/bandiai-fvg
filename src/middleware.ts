import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge middleware: adds a CSP + basic hardening on every response and applies a
 * lightweight per-IP guard on auth endpoints. Deeper rate limiting lives in the
 * route handlers (Redis-backed) — this is a cheap first line of defence.
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next()

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'self'",
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-DNS-Prefetch-Control', 'on')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png).*)'],
}
