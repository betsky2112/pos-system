import {clearAuthCookie} from '@/lib/auth'
import {NextResponse} from 'next/server'

export async function POST() {
	clearAuthCookie()

	return NextResponse.json({message: 'Logout berhasil'}, {status: 200})
}
