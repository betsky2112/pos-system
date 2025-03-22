import {SignJWT, jwtVerify} from 'jose'
import bcrypt from 'bcryptjs'
import {cookies} from 'next/headers'

export type JWTPayload = {
	id: string
	email: string
	name: string
	role: string
}

// Function untuk hash password
export const hashPassword = async (password: string) => {
	return await bcrypt.hash(password, 10)
}

// Function untuk verifikasi password
export const comparePasswords = async (
	plainPassword: string,
	hashedPassword: string
) => {
	return await bcrypt.compare(plainPassword, hashedPassword)
}

// Function untuk generate JWT token menggunakan jose
export const generateJwtToken = async (payload: JWTPayload) => {
	if (!process.env.NEXTAUTH_SECRET) {
		throw new Error('NEXTAUTH_SECRET not set in environment variables')
	}

	const secretKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

	const token = await new SignJWT(payload)
		.setProtectedHeader({alg: 'HS256'})
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(secretKey)

	return token
}

// Function untuk verifikasi JWT token menggunakan jose
export const verifyJwtToken = async (token: string) => {
	if (!process.env.NEXTAUTH_SECRET) {
		throw new Error('NEXTAUTH_SECRET not set in environment variables')
	}

	try {
		const secretKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
		const {payload} = await jwtVerify(token, secretKey)
		return payload as JWTPayload
	} catch (error) {
		console.error('JWT verification failed:', error)
		throw error
	}
}

// Function untuk set auth cookie
export const setAuthCookie = async (token: string) => {
	const cookieStore = await cookies()
	cookieStore.set({
		name: 'token',
		value: token,
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7, // 7 days
		sameSite: 'lax',
	})
}
// Function untuk clear auth cookie
export const clearAuthCookie = async () => {
	const cookieStore = await cookies()
	cookieStore.delete('token')
}
// Function untuk get auth token
export const getAuthToken = async () => {
	const cookieStore = await cookies()
	return cookieStore.get('token')?.value
}
