import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'
import {Prisma} from '@prisma/client'

// GET products
export async function GET(req: NextRequest) {
	try {
		// Verifikasi token
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		verifyJwtToken(token)

		// Ambil query parameters
		const {searchParams} = new URL(req.url)
		const page = parseInt(searchParams.get('page') || '1', 10)
		const limit = parseInt(searchParams.get('limit') || '10', 10)
		const search = searchParams.get('search') || ''
		const categoryId = searchParams.get('categoryId') || ''
		// Query untuk produk
		const where: Prisma.ProductWhereInput = {
			...(categoryId ? {categoryId} : {}),
			...(search
				? {
						OR: [
							{
								name: {
									contains: search,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								description: {
									contains: search,
									mode: Prisma.QueryMode.insensitive,
								},
							},
						],
				  }
				: {}),
		}

		// Dapatkan total produk
		const totalItems = await prisma.product.count({where})

		// Dapatkan produk dengan detail kategori
		const products = await prisma.product.findMany({
			where,
			include: {
				category: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			skip: (page - 1) * limit,
			take: limit,
		})

		const totalPages = Math.ceil(totalItems / limit)

		return NextResponse.json({
			products,
			pagination: {
				page,
				limit,
				totalItems,
				totalPages,
			},
		})
	} catch (error) {
		console.error('Error fetching products:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
