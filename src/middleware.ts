import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {verifyJwtToken} from './lib/auth'

export async function middleware(request: NextRequest) {
	const {pathname} = request.nextUrl

	if (
		pathname === '/login' ||
		pathname === '/register' ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/api/auth')
	) {
		return NextResponse.next()
	}

	const token = request.cookies.get('token')?.value

	if (!token) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	try {
		const payload = await verifyJwtToken(token)

		// jika user bukan admin dan mencoba mengakses halaman admin
		if (
			payload.role !== 'ADMIN' &&
			(pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))
		) {
			return NextResponse.redirect(new URL('/dashboard', request.url))
		}
		return NextResponse.next()
	} catch (error) {
		return NextResponse.redirect(new URL('/login', request.url))
	}
}

export const config = {
	matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
