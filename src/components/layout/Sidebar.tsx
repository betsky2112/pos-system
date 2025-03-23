'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {
	FiHome,
	FiShoppingBag,
	FiUsers,
	FiShoppingCart,
	FiList,
	FiLogOut,
} from 'react-icons/fi'
import {useAuth} from '@/hooks/useAuth'
import {cn} from '@/lib/utils'

type SidebarItem = {
	href: string
	label: string
	icon: React.ReactNode
	adminOnly?: boolean
}

const menuItems: SidebarItem[] = [
	{
		href: '/dashboard',
		label: 'Dashboard',
		icon: <FiHome className="w-5 h-5" />,
	},
	{
		href: '/products',
		label: 'Produk',
		icon: <FiShoppingBag className="w-5 h-5" />,
	},
	{
		href: '/transactions',
		label: 'Transaksi',
		icon: <FiShoppingCart className="w-5 h-5" />,
	},
	{
		href: '/history',
		label: 'Riwayat',
		icon: <FiList className="w-5 h-5" />,
	},
	{
		href: '/users',
		label: 'Pengguna',
		icon: <FiUsers className="w-5 h-5" />,
		adminOnly: true,
	},
]

export default function Sidebar() {
	const pathname = usePathname()
	const {user, logout, isAdmin} = useAuth()

	// Handle logout click
	const handleLogout = async (e: React.MouseEvent) => {
		e.preventDefault()
		try {
			await logout()
			// Tidak perlu redirect di sini, karena sudah ditangani oleh hook useAuth
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	// Filter menu items berdasarkan role
	const filteredMenuItems = menuItems.filter((item) => {
		if (item.adminOnly && !isAdmin) {
			return false
		}
		return true
	})

	return (
		<div className="h-full w-64 bg-white dark:bg-gray-800 shadow-lg">
			<div className="flex flex-col h-full">
				<div className="p-4">
					<h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
						POS System
					</h1>
				</div>

				<nav className="flex-1 px-2 py-4 space-y-1">
					{filteredMenuItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
								pathname === item.href
									? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200'
									: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
							)}
						>
							{item.icon}
							<span className="ml-3">{item.label}</span>
						</Link>
					))}
				</nav>

				<div className="p-4 border-t border-gray-200 dark:border-gray-700">
					{user && (
						<div className="flex flex-col space-y-3">
							<div className="flex flex-col">
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
									{user.name}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{user.email}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{user.role === 'ADMIN' ? 'Admin' : 'Kasir'}
								</span>
							</div>

							<button
								onClick={handleLogout}
								className="flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
							>
								<FiLogOut className="w-5 h-5" />
								<span className="ml-3">Logout</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
