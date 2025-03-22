import {comparePassword, generateJwtToken, setAuthCookie} from '@/lib/auth'
import prisma from '@/lib/prisma'
import {Princess_Sofia} from 'next/font/google'
import {NextRequest, NextResponse} from 'next/server'
import {error} from 'node:console'
import {MdWhereToVote} from 'react-icons/md'
import {z} from 'zod'

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		// validasi input
		const validation = loginSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{error: 'Validasi gagal', details: validation.error.format()},
				{status: 400}
			)
		}

		const {email, password} = body

		// cari user berdasarkan email
		const user = await prisma.user.findUnique({
			where: {email},
		})

		if (!user) {
			return NextResponse.json(
				{error: 'Email tidak ditemukan'},
				{status: 400}
			)
		}

		// verifikasi password
		const isPasswordValid = await comparePassword(password, user.password)

		if (!isPasswordValid) {
			return NextResponse.json({error: 'Password salah'}, {status: 401})
		}

		// generate jwt token
		const token = generateJwtToken({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		})

		setAuthCookie(token)

		// hapus password dari respon
		const {password: _, ...userWithoutPassword} = user

		return NextResponse.json(
			{user: userWithoutPassword, message: 'Login berhasil'},
			{status: 200}
		)
	} catch (error) {
		console.error('Login error: ', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
