'use client'

import {useEffect} from 'react'
import {useAuthStore} from '@/store/authStore'
import {useRouter} from 'next/navigation'
import axios from 'axios'

/**
 * Custom hook untuk mengelola autentikasi pengguna
 */
export function useAuth() {
	const {user, loading, error, fetchUser, clearUser} = useAuthStore()
	const router = useRouter()

	// Fetch user data pada client-side mount
	useEffect(() => {
		if (loading) {
			fetchUser().catch((error) => {
				console.error('Failed to fetch user:', error)
			})
		}
	}, [fetchUser, loading])

	// Fungsi logout dengan redirect
	const handleLogout = async () => {
		try {
			// Call the logout API
			await axios.post('/api/auth/logout')

			// Clear user data from store
			clearUser()

			// Navigate to login page
			window.location.href = '/login' // Gunakan window.location untuk reload penuh
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	return {
		user,
		loading,
		error,
		logout: handleLogout,
		isAdmin: user?.role === 'ADMIN',
		isAuthenticated: !!user,
	}
}
