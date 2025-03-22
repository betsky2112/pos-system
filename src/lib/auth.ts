import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

export const comparePasswords = async (
	plainPassword: string,
	hashedPassword: string
) => {
	return await bcrypt.compare(plainPassword, hashedPassword)
}

export const generateJwtToken = (payload: JWTPayload) => {
	if (!process.env.NEXTAUTH_SECRET) {
		throw new Error('NEXTAUTH_SECRET not set in environment variables')
	}

	return jwt.sign(payload, process.env.NEXTAUTH_SECRET, {
		expiresIn: '7d',
	})
}

export const verifyJwtToken = (token: string) => {
	if (!process.env.NEXTAUTH_SECRET) {
		throw new Error('NEXTAUTH_SECRET not set in environment variables')
	}

	try {
		return jwt.verify(token, process.env.NEXTAUTH_SECRET) as JWTPayload
	} catch (error) {
		console.error('JWT verification failed:', error)
		throw error
	}
}

export const setAuthCookie = async (token: string) => {
	;(await cookies()).set({
		name: 'token',
		value: token,
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7, // 7 days
		sameSite: 'lax',
	})
}

export const clearAuthCookie = async () => {
	;(await cookies()).delete('token')
}

export const getAuthToken = async () => {
	return (await cookies()).get('token')?.value
}
