import {NextResponse} from 'next/server'

export async function POST() {
	// Buat response
	const response = NextResponse.json(
		{success: true, message: 'Logout berhasil'},
		{status: 200}
	)

	// Clear cookie secara manual di response
	response.cookies.set({
		name: 'token',
		value: '',
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 0, // Expire immediately
		sameSite: 'lax',
	})

	return response
}
