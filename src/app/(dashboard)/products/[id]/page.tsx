import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

// GET product by ID
export async function GET(req: NextRequest, {params}: {params: {id: string}}) {
	try {
		// Verifikasi token
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		const {id} = params

		// Ambil produk dengan detail kategori
		const product = await prisma.product.findUnique({
			where: {id},
			include: {
				category: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		if (!product) {
			return NextResponse.json(
				{error: 'Produk tidak ditemukan'},
				{status: 404}
			)
		}

		return NextResponse.json({product})
	} catch (error) {
		console.error('Error fetching product:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// UPDATE product
export async function PUT(req: NextRequest, {params}: {params: {id: string}}) {
	try {
		// Verifikasi token
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa mengupdate produk
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Hanya admin yang dapat mengupdate produk'},
				{status: 403}
			)
		}

		const {id} = params
		const body = await req.json()

		// Validasi input
		const {name, description, price, stock, categoryId, image} = body

		if (
			!name ||
			price === undefined ||
			stock === undefined ||
			!categoryId
		) {
			return NextResponse.json(
				{error: 'Data tidak lengkap'},
				{status: 400}
			)
		}

		// Verifikasi produk exists
		const productExists = await prisma.product.findUnique({
			where: {id},
		})

		if (!productExists) {
			return NextResponse.json(
				{error: 'Produk tidak ditemukan'},
				{status: 404}
			)
		}

		// Verifikasi kategori exists
		const categoryExists = await prisma.category.findUnique({
			where: {id: categoryId},
		})

		if (!categoryExists) {
			return NextResponse.json(
				{error: 'Kategori tidak ditemukan'},
				{status: 400}
			)
		}

		// Update produk
		const product = await prisma.product.update({
			where: {id},
			data: {
				name,
				description,
				price,
				stock,
				categoryId,
				image,
			},
		})

		return NextResponse.json({product, message: 'Produk berhasil diupdate'})
	} catch (error) {
		console.error('Error updating product:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// DELETE product
export async function DELETE(
	req: NextRequest,
	{params}: {params: {id: string}}
) {
	try {
		// Verifikasi token
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa menghapus produk
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Hanya admin yang dapat menghapus produk'},
				{status: 403}
			)
		}

		const {id} = params

		// Verifikasi produk exists
		const productExists = await prisma.product.findUnique({
			where: {id},
		})

		if (!productExists) {
			return NextResponse.json(
				{error: 'Produk tidak ditemukan'},
				{status: 404}
			)
		}

		// Check if product is used in any transaction
		const usedInTransaction = await prisma.transactionItem.findFirst({
			where: {productId: id},
		})

		if (usedInTransaction) {
			return NextResponse.json(
				{
					error: 'Produk tidak dapat dihapus karena sudah digunakan dalam transaksi',
				},
				{status: 400}
			)
		}

		// Hapus produk
		await prisma.product.delete({
			where: {id},
		})

		return NextResponse.json({message: 'Produk berhasil dihapus'})
	} catch (error) {
		console.error('Error deleting product:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
