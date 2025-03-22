import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {hashPassword, generateJwtToken} from '@/lib/auth'
import {z} from 'zod'

// Validasi input
const registerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
})

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		// Validasi input
		const validation = registerSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{error: 'Validasi gagal', details: validation.error.format()},
				{status: 400}
			)
		}

		const {name, email, password} = body

		// Cek apakah email sudah digunakan
		const existingUser = await prisma.user.findUnique({
			where: {email},
		})

		if (existingUser) {
			return NextResponse.json(
				{error: 'Email sudah terdaftar'},
				{status: 400}
			)
		}

		// Hash password
		const hashedPassword = await hashPassword(password)

		// Pengguna pertama menjadi admin, lainnya menjadi kasir
		const isFirstUser = (await prisma.user.count()) === 0
		const role = isFirstUser ? 'ADMIN' : 'CASHIER'

		// Buat user baru
		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role,
			},
		})

		// Generate JWT token menggunakan jose
		const token = await generateJwtToken({
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			role: newUser.role,
		})

		// Buat response dengan user data
		const response = NextResponse.json(
			{
				user: {
					id: newUser.id,
					email: newUser.email,
					name: newUser.name,
					role: newUser.role,
				},
				message: 'Registrasi berhasil',
			},
			{status: 201}
		)

		// Set cookie secara manual di response
		response.cookies.set({
			name: 'token',
			value: token,
			httpOnly: true,
			path: '/',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7, // 7 days
			sameSite: 'lax',
		})

		return response
	} catch (error) {
		console.error('Register error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
