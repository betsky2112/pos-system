import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

// GET - Mendapatkan semua kategori
export async function GET(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		// Dapatkan semua kategori
		const categories = await prisma.category.findMany({
			orderBy: {
				name: 'asc',
			},
		})

		return NextResponse.json(categories)
	} catch (error) {
		console.error('Get categories error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}

// POST - Membuat kategori baru
export async function POST(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const payload = await verifyJwtToken(token)

		// Hanya admin yang bisa menambah kategori
		if (payload.role !== 'ADMIN') {
			return NextResponse.json(
				{error: 'Forbidden - Only admin can create categories'},
				{status: 403}
			)
		}

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

		// Cek apakah kategori dengan nama sama sudah ada
		const existingCategory = await prisma.category.findFirst({
			where: {
				name: {
					equals: body.name,
					mode: 'insensitive', // Case insensitive
				},
			},
		})

		if (existingCategory) {
			return NextResponse.json(
				{error: 'Kategori dengan nama tersebut sudah ada'},
				{status: 400}
			)
		}

		// Buat kategori baru
		const newCategory = await prisma.category.create({
			data: {
				name: body.name.trim(),
			},
		})

		return NextResponse.json(newCategory, {status: 201})
	} catch (error) {
		console.error('Create category error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
