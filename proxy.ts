import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === "/search") {
        return NextResponse.redirect(new URL('/', request.url))
    }
}