import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {verifyJwtToken} from './lib/auth'

export async function middleware(request: NextRequest) {
	const {pathname} = request.nextUrl

	// Debugging
	console.log(`Middleware running for path: ${pathname}`)

	// Rute publik yang tidak memerlukan autentikasi
	if (
		pathname === '/login' ||
		pathname === '/register' ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/api/auth') ||
		pathname.includes('favicon.ico') ||
		pathname.includes('.png') ||
		pathname.includes('.jpg') ||
		pathname.includes('.svg')
	) {
		console.log('Public route, skipping auth check')
		return NextResponse.next()
	}

	// Verifikasi token
	const token = request.cookies.get('token')?.value
	console.log('Token found:', !!token)

	if (!token) {
		console.log('No token, redirecting to login')
		return NextResponse.redirect(new URL('/login', request.url))
	}

	try {
		const payload = await verifyJwtToken(token)
		console.log('Token verified, payload role:', payload.role)

		// Jika user bukan admin dan mencoba mengakses halaman admin
		if (
			payload.role !== 'ADMIN' &&
			(pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))
		) {
			console.log('Non-admin trying to access admin route, redirecting')
			return NextResponse.redirect(new URL('/dashboard', request.url))
		}

		// Add user info to headers for server components
		const requestHeaders = new Headers(request.headers)
		requestHeaders.set('x-user-id', payload.id)
		requestHeaders.set('x-user-role', payload.role)

		const response = NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		})

		return response
	} catch (error) {
		console.error('Token verification failed:', error)
		return NextResponse.redirect(new URL('/login', request.url))
	}
}

// Match all request paths except for the ones starting with:
export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
