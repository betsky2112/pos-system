import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {comparePasswords, generateJwtToken, setAuthCookie} from '@/lib/auth'
import {z} from 'zod'

// Validasi input
const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		// Validasi input
		const validation = loginSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{error: 'Validasi gagal', details: validation.error.format()},
				{status: 400}
			)
		}

		const {email, password} = body

		// Cari user berdasarkan email
		const user = await prisma.user.findUnique({
			where: {email},
		})

		if (!user) {
			return NextResponse.json(
				{error: 'Email atau password salah'},
				{status: 401}
			)
		}

		// Verifikasi password
		const isPasswordValid = await comparePasswords(password, user.password)

		if (!isPasswordValid) {
			return NextResponse.json(
				{error: 'Email atau password salah'},
				{status: 401}
			)
		}

		// Generate JWT token
		const token = generateJwtToken({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		})

		// Set cookie - PERBAIKAN: pastikan cookie disimpan dengan benar
		const response = NextResponse.json(
			{
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
				message: 'Login berhasil',
			},
			{status: 200}
		)

		// Set cookie secara manual di response
		response.cookies.set({
			name: 'token',
			value: token,
			httpOnly: true,
			path: '/',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7, // 7 days
		})

		return response
	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
