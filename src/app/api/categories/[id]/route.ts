import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

// GET - Mendapatkan kategori berdasarkan ID
export async function GET(req: NextRequest, {params}: {params: {id: string}}) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		const categoryId = params.id

		// Dapatkan kategori berdasarkan ID
		const category = await prisma.category.findUnique({
			where: {id: categoryId},
		})

		if (!category) {
			return NextResponse.json(
				{error: 'Kategori tidak ditemukan'},
				{status: 404}
			)
		}

		return NextResponse.json(category)
	} catch (error) {
		console.error('Get category error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// PUT - Mengupdate kategori berdasarkan ID
export async function PUT(req: NextRequest, {params}: {params: {id: string}}) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa mengupdate kategori
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Forbidden - Only admin can update categories'},
				{status: 403}
			)
		}

		const categoryId = params.id

		// Parse body request
		const body = await req.json()

		// Validasi input
		if (
			!body.name ||
			typeof body.name !== 'string' ||
			body.name.trim() === ''
		) {
			return NextResponse.json(
				{error: 'Nama kategori harus diisi'},
				{status: 400}
			)
		}

		// Cek apakah kategori dengan ID tersebut ada
		const existingCategory = await prisma.category.findUnique({
			where: {id: categoryId},
		})

		if (!existingCategory) {
			return NextResponse.json(
				{error: 'Kategori tidak ditemukan'},
				{status: 404}
			)
		}

		// Cek apakah ada kategori lain dengan nama yang sama
		const duplicateCategory = await prisma.category.findFirst({
			where: {
				name: {
					equals: body.name,
					mode: 'insensitive', // Case insensitive
				},
				id: {
					not: categoryId,
				},
			},
		})

		if (duplicateCategory) {
			return NextResponse.json(
				{error: 'Kategori dengan nama tersebut sudah ada'},
				{status: 400}
			)
		}

		// Update kategori
		const updatedCategory = await prisma.category.update({
			where: {id: categoryId},
			data: {
				name: body.name.trim(),
			},
		})

		return NextResponse.json(updatedCategory)
	} catch (error) {
		console.error('Update category error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// DELETE - Menghapus kategori berdasarkan ID
export async function DELETE(
	req: NextRequest,
	{params}: {params: {id: string}}
) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa menghapus kategori
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Forbidden - Only admin can delete categories'},
				{status: 403}
			)
		}

		const categoryId = params.id

		// Cek apakah kategori dengan ID tersebut ada
		const existingCategory = await prisma.category.findUnique({
			where: {id: categoryId},
			include: {
				products: {
					select: {
						id: true,
					},
				},
			},
		})

		if (!existingCategory) {
			return NextResponse.json(
				{error: 'Kategori tidak ditemukan'},
				{status: 404}
			)
		}

		// Cek apakah kategori masih memiliki produk
		if (existingCategory.products.length > 0) {
			return NextResponse.json(
				{
					error: 'Kategori tidak dapat dihapus karena masih memiliki produk',
					productCount: existingCategory.products.length,
				},
				{status: 400}
			)
		}

		// Hapus kategori
		await prisma.category.delete({
			where: {id: categoryId},
		})

		return NextResponse.json(
			{message: 'Kategori berhasil dihapus'},
			{status: 200}
		)
	} catch (error) {
		console.error('Delete category error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
