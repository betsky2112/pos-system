import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

// GET - Mendapatkan semua transaksi
export async function GET(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		// Dapatkan semua transaksi
		const transactions = await prisma.transaction.findMany({
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		return NextResponse.json(transactions)
	} catch (error) {
		console.error('Get transactions error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
