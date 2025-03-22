'use client'

import {useState, useEffect} from 'react'
import {useRouter, usePathname} from 'next/navigation'
import {Toaster} from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import {useAuth} from '@/hooks/useAuth'

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const router = useRouter()
	const pathname = usePathname()
	const {user, loading} = useAuth()

	// Tunggu auth state diverifikasi
	useEffect(() => {
		if (!loading && !user) {
			router.push('/login')
		}
	}, [user, loading, router])

	// Toggle sidebar
	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen)
	}

	// Tampilkan loading state selama auth di-check
	if (loading) {
		return (
			<div className="h-screen w-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		)
	}

	return (
		<div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
			{/* Sidebar mobile */}
			<div
				className={`md:hidden fixed inset-0 z-40 transform ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} transition-transform duration-300 ease-in-out`}
			>
				<div className="relative h-full">
					<Sidebar />
					<div
						className="absolute inset-0 bg-gray-600 bg-opacity-75"
						onClick={toggleSidebar}
						style={{marginLeft: '16rem'}}
					></div>
				</div>
			</div>

			{/* Sidebar desktop */}
			<div className="hidden md:block">
				<Sidebar />
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header toggleSidebar={toggleSidebar} />

				<main className="flex-1 overflow-y-auto p-4">{children}</main>
			</div>

			<Toaster position="top-right" />
		</div>
	)
}
