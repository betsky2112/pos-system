import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

export async function GET(req: NextRequest) {
	try {
		// Verifikasi auth token
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Verifikasi token dan dapatkan payload
		const payload = await verifyJwtToken(token)

		// Dapatkan data user lengkap dari database
		const user = await prisma.user.findUnique({
			where: {id: payload.id},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404})
		}

		return NextResponse.json({user})
	} catch (error) {
		console.error('Auth me error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
