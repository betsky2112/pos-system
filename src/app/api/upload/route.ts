import {NextRequest, NextResponse} from 'next/server'
import {writeFile} from 'fs/promises'
import {join} from 'path'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'
import {v4 as uuid} from 'uuid'

export async function POST(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		// Proses upload file
		const formData = await req.formData()
		const file = formData.get('file') as File

		if (!file) {
			return NextResponse.json({error: 'No file uploaded'}, {status: 400})
		}

		// Validasi tipe file (hanya gambar)
		const allowedTypes = [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif',
		]
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error: 'File type not allowed. Please upload an image file (JPEG, PNG, WEBP, GIF).',
				},
				{status: 400}
			)
		}

		// Validasi ukuran file (max 5MB)
		const maxSize = 5 * 1024 * 1024 // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{error: 'File too large. Maximum size is 5MB.'},
				{status: 400}
			)
		}

		// Buat nama file unik
		const extension = file.name.split('.').pop()
		const fileName = `${uuid()}.${extension}`

		// Path untuk menyimpan file
		const publicDir = join(process.cwd(), 'public')
		const uploadsDir = join(publicDir, 'uploads')

		// Konversi file ke buffer
		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		// Cek dan buat direktori jika belum ada
		try {
			await writeFile(join(uploadsDir, fileName), buffer)
		} catch (error) {
			console.error('Error saving file:', error)
			return NextResponse.json(
				{error: 'Failed to save file'},
				{status: 500}
			)
		}

		// URL path untuk mengakses file
		const fileUrl = `/uploads/${fileName}`

		return NextResponse.json({
			message: 'File uploaded successfully',
			url: fileUrl,
		})
	} catch (error) {
		console.error('Upload error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
