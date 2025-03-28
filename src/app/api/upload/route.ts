import {NextRequest, NextResponse} from 'next/server'
import {writeFile} from 'fs/promises'
import path from 'path'
import {v4 as uuidv4} from 'uuid'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

export async function POST(req: NextRequest) {
	try {
		// Verifikasi token
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		const formData = await req.formData()
		const file = formData.get('file') as File

		if (!file) {
			return NextResponse.json(
				{error: 'File tidak ditemukan'},
				{status: 400}
			)
		}

		// Validasi tipe file
		const allowedTypes = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/webp',
		]
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error: 'Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP',
				},
				{status: 400}
			)
		}

		// Validasi ukuran file (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			return NextResponse.json(
				{error: 'Ukuran file terlalu besar. Maksimal 2MB'},
				{status: 400}
			)
		}

		// Generate unique filename
		const filename = `${uuidv4()}${path.extname(file.name)}`
		const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

		// Save file to disk
		await writeFile(filepath, Buffer.from(await file.arrayBuffer()))

		return NextResponse.json({url: `/uploads/${filename}`}, {status: 201})
	} catch (error) {
		console.error('Error uploading file:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
