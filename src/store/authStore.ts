import {create} from 'zustand'
import axios from 'axios'
import {jwtDecode} from 'jwt-decode'

// Tipe data untuk user
export type User = {
	id: string
	name: string
	email: string
	role: string
}

// Tipe data untuk auth store
type AuthStore = {
	user: User | null
	loading: boolean
	error: string | null

	// Actions
	fetchUser: () => Promise<void>
	login: (email: string, password: string) => Promise<void>
	register: (name: string, email: string, password: string) => Promise<void>
	logout: () => Promise<void>
	clearError: () => void
}

// Buat Auth Store dengan Zustand
export const useAuthStore = create<AuthStore>((set, get) => ({
	user: null,
	loading: true,
	error: null,

	// Ambil data user dari API
	fetchUser: async () => {
		try {
			set({loading: true, error: null})

			const response = await axios.get('/api/auth/me')

			if (response.data.user) {
				set({user: response.data.user, loading: false})
			} else {
				set({user: null, loading: false})
			}
		} catch (error) {
			console.error('Error fetching user:', error)
			set({user: null, loading: false})
		}
	},

	// Login user
	login: async (email: string, password: string) => {
		try {
			set({loading: true, error: null})

			const response = await axios.post('/api/auth/login', {
				email,
				password,
			})

			set({
				user: response.data.user,
				loading: false,
				error: null,
			})

			return response.data.user
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.error || 'Gagal login. Silakan coba lagi.'
			set({loading: false, error: errorMessage})
			throw new Error(errorMessage)
		}
	},

	// Register user
	register: async (name: string, email: string, password: string) => {
		try {
			set({loading: true, error: null})

			const response = await axios.post('/api/auth/register', {
				name,
				email,
				password,
			})

			set({
				user: response.data.user,
				loading: false,
				error: null,
			})

			return response.data.user
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.error ||
				'Gagal registrasi. Silakan coba lagi.'
			set({loading: false, error: errorMessage})
			throw new Error(errorMessage)
		}
	},

	// Logout user
	logout: async () => {
		try {
			await axios.post('/api/auth/logout')
			set({user: null, error: null})
		} catch (error) {
			console.error('Error during logout:', error)
		}
	},

	// Clear error state
	clearError: () => set({error: null}),
}))
