import {useEffect} from 'react'
import {useAuthStore} from '@/store/authStore'

export function useAuth() {
	const {user, loading, error, fetchUser, logout} = useAuthStore()

	useEffect(() => {
		if (loading) {
			fetchUser()
		}
	}, [fetchUser, loading])

	return {
		user,
		loading,
		error,
		logout,
		isAdmin: user?.role === 'ADMIN',
		isAuthenticated: !!user,
	}
}
