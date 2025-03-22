import {useEffect} from 'react'
import {useAuthStore} from '@/store/authStore'
import {useRouter} from 'next/navigation'

export function useAuth() {
	const {user, loading, error, fetchUser, logout} = useAuthStore()
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
		await logout()
		router.push('/login')
		router.refresh()
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
