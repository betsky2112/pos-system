import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'
import {z} from 'zod'
import fs from 'fs'
import path from 'path'

// Schema validasi untuk update produk
const productUpdateSchema = z.object({
	name: z.string().min(1, 'Nama produk harus diisi'),
	description: z.string().optional(),
	price: z.number().positive('Harga produk harus lebih dari 0'),
	stock: z.number().int().nonnegative('Stok tidak boleh negatif'),
	categoryId: z.string().min(1, 'Kategori harus dipilih'),
	image: z.string().optional().nullable(),
})

// GET - Mendapatkan produk berdasarkan ID
export async function GET(req: NextRequest, context: {params: {id: string}}) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		const params = await context.params
		const productId = params.id

		// Dapatkan produk berdasarkan ID
		const product = await prisma.product.findUnique({
			where: {id: productId},
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

		return NextResponse.json(product)
	} catch (error) {
		console.error('Get product error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// PUT - Mengupdate produk berdasarkan ID
export async function PUT(req: NextRequest, context: {params: {id: string}}) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa mengupdate produk
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Forbidden - Only admin can update products'},
				{status: 403}
			)
		}

		const params = await context.params
		const productId = params.id

		// Parse body request
		const body = await req.json()

		// Convert price and stock to numbers if they're strings
		if (typeof body.price === 'string') body.price = parseFloat(body.price)
		if (typeof body.stock === 'string') body.stock = parseInt(body.stock)

		// Validasi input
		const validation = productUpdateSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{
					error: 'Validasi gagal',
					details: validation.error.format(),
				},
				{status: 400}
			)
		}

		// Cek apakah produk dengan ID tersebut ada
		const existingProduct = await prisma.product.findUnique({
			where: {id: productId},
		})

		if (!existingProduct) {
			return NextResponse.json(
				{error: 'Produk tidak ditemukan'},
				{status: 404}
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

		// Update produk
		const updatedProduct = await prisma.product.update({
			where: {id: productId},
			data: {
				name: body.name,
				description: body.description || '',
				price: body.price,
				stock: body.stock,
				categoryId: body.categoryId,
				image: body.image,
			},
		})

		return NextResponse.json(updatedProduct)
	} catch (error) {
		console.error('Update product error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// DELETE - Menghapus produk berdasarkan ID
export async function DELETE(
	req: NextRequest,
	context: {params: {id: string}}
) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa menghapus produk
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Forbidden - Only admin can delete products'},
				{status: 403}
			)
		}

		const params = await context.params
		const productId = params.id

		// Cek apakah produk dengan ID tersebut ada
		const existingProduct = await prisma.product.findUnique({
			where: {id: productId},
			include: {
				transactionItems: {
					select: {
						id: true,
					},
				},
			},
		})

		if (!existingProduct) {
			return NextResponse.json(
				{error: 'Produk tidak ditemukan'},
				{status: 404}
			)
		}

		// Cek apakah produk sudah pernah digunakan dalam transaksi
		if (existingProduct.transactionItems.length > 0) {
			return NextResponse.json(
				{
					error: 'Produk tidak dapat dihapus karena sudah terdapat dalam transaksi',
					transactionCount: existingProduct.transactionItems.length,
				},
				{status: 400}
			)
		}

		// Hapus file gambar produk jika ada
		if (existingProduct.image) {
			const imagePath = path.join(
				process.cwd(),
				'public',
				existingProduct.image
			)

			try {
				if (fs.existsSync(imagePath)) {
					fs.unlinkSync(imagePath)
				}
			} catch (err) {
				console.error('Error deleting image file:', err)
				// Continue with deletion even if image deletion fails
			}
		}

		// Hapus produk
		await prisma.product.delete({
			where: {id: productId},
		})

		return NextResponse.json(
			{message: 'Produk berhasil dihapus'},
			{status: 200}
		)
	} catch (error) {
		console.error('Delete product error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
