import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {cookies} from 'next/headers'

export type JWTPayload = {
	id: string
	email: string
	name: string
	role: string
}

export const hashPassword = async (password: string) => {
	return await bcrypt.hash(password, 10)
}

export const comparePassword = async (
	plainPassword: string,
	hashedPassword: string
) => {
	return await bcrypt.compare(plainPassword, hashedPassword)
}

export const generateJwtToken = (payload: JWTPayload) => {
	return jwt.sign(payload, process.env.JWT_SECRET as string, {
		expiresIn: '7d',
	})
}

export const verifyJwtToken = (token: string) => {
	return jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload
}

export const setAuthCookie = async (token: string) => {
	const cookieStore = await cookies()
	cookieStore.set({
		name: 'token',
		value: token,
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7,
	})
}

export const clearAuthCookie = async () => {
	const cookieStore = await cookies()
	cookieStore.delete('token')
}

export const getAuthToken = async () => {
	const cookieStore = await cookies()
	return cookieStore.get('token')?.value
}
