import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'
import {z} from 'zod'

// Schema validasi untuk produk
const productSchema = z.object({
	name: z.string().min(1, 'Nama produk harus diisi'),
	description: z.string().optional(),
	price: z.number().positive('Harga produk harus lebih dari 0'),
	stock: z.number().int().nonnegative('Stok tidak boleh negatif'),
	categoryId: z.string().min(1, 'Kategori harus dipilih'),
	image: z.string().optional(),
})

// GET - Mendapatkan semua produk dengan filter dan pencarian
export async function GET(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		// Parse query parameters
		const {searchParams} = new URL(req.url)
		const search = searchParams.get('search') || ''
		const categoryId = searchParams.get('categoryId')
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const sortBy = searchParams.get('sortBy') || 'name'
		const sortOrder = searchParams.get('sortOrder') || 'asc'

		// Validasi pagination params
		const validPage = page > 0 ? page : 1
		const validLimit = limit > 0 ? (limit <= 100 ? limit : 100) : 10
		const skip = (validPage - 1) * validLimit

		// Validasi sort params
		const validSortBy = ['name', 'price', 'stock', 'createdAt'].includes(
			sortBy as string
		)
			? (sortBy as string)
			: 'name'

		const validSortOrder = ['asc', 'desc'].includes(sortOrder as string)
			? (sortOrder as string)
			: 'asc'

		// Build where clause
		const where: any = {}

		if (search) {
			where.name = {
				contains: search,
				mode: 'insensitive', // Case insensitive
			}
		}

		if (categoryId) {
			where.categoryId = categoryId
		}

		// Query untuk mendapatkan total produk (untuk pagination)
		const totalProducts = await prisma.product.count({where})

		// Query untuk mendapatkan produk dengan pagination
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
				[validSortBy]: validSortOrder,
			},
			skip,
			take: validLimit,
		})

		// Hitung total halaman
		const totalPages = Math.ceil(totalProducts / validLimit)

		return NextResponse.json({
			products,
			pagination: {
				page: validPage,
				limit: validLimit,
				totalItems: totalProducts,
				totalPages,
			},
		})
	} catch (error) {
		console.error('Get products error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// POST - Membuat produk baru
export async function POST(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa menambah produk
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Forbidden - Only admin can create products'},
				{status: 403}
			)
		}

		// Parse body request
		const body = await req.json()

		// Convert price and stock to numbers if they're strings
		if (typeof body.price === 'string') body.price = parseFloat(body.price)
		if (typeof body.stock === 'string') body.stock = parseInt(body.stock)

		// Validasi input
		const validation = productSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{
					error: 'Validasi gagal',
					details: validation.error.format(),
				},
				{status: 400}
			)
		}

		// Cek apakah kategori dengan ID tersebut ada
		const category = await prisma.category.findUnique({
			where: {id: body.categoryId},
		})

		if (!category) {
			return NextResponse.json(
				{error: 'Kategori tidak ditemukan'},
				{status: 400}
			)
		}

		// Buat produk baru
		const newProduct = await prisma.product.create({
			data: {
				name: body.name,
				description: body.description || '',
				price: body.price,
				stock: body.stock,
				categoryId: body.categoryId,
				image: body.image || null,
			},
		})

		return NextResponse.json(newProduct, {status: 201})
	} catch (error) {
		console.error('Create product error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
