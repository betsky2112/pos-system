import {generateJwtToken, hashPassword, setAuthCookie} from '@/lib/auth'
import prisma from '@/lib/prisma'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'

const registerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
})

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		// validasi input
		const validation = registerSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{error: 'Validasi gagal', details: validation.error.format()},
				{status: 400}
			)
		}

		const {name, email, password} = body

		// cek apakah email sudah digunakan
		const existingUser = await prisma.user.findUnique({
			where: {email},
		})

		if (existingUser) {
			return NextResponse.json(
				{error: 'Email sudah terdaftar'},
				{status: 400}
			)
		}

		// hash password
		const hashedPassword = await hashPassword(password)

		// pengguna pertama menjadi admin, lainnya menjadi kasir
		const isFirstUser = (await prisma.user.count()) === 0
		const role = isFirstUser ? 'ADMIN' : 'CASHIER'

		// buat user baru
		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role,
			},
		})

		// generate jwt token
		const token = generateJwtToken({
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			role: newUser.role,
		})

		setAuthCookie(token)

		const {password: _, ...userWithoutPassword} = newUser

		return NextResponse.json(
			{user: userWithoutPassword, message: 'Registrasi Berhasil'},
			{status: 201}
		)
	} catch (error) {
		console.error('Register error: ', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
