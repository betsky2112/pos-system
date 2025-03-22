'use client'

import {useTheme} from 'next-themes'
import {FiMoon, FiSun, FiMenu} from 'react-icons/fi'
import {useState, useEffect} from 'react'

type HeaderProps = {
	toggleSidebar: () => void
}

export default function Header({toggleSidebar}: HeaderProps) {
	const {theme, setTheme} = useTheme()
	const [mounted, setMounted] = useState(false)

	// Theme toggle
	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark')
	}

	// Wait until mounted to show theme toggle (prevents hydration mismatch)
	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center px-4">
			<button
				className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
				onClick={toggleSidebar}
			>
				<FiMenu className="h-6 w-6" />
			</button>

			<div className="flex-1"></div>

			{mounted && (
				<button
					onClick={toggleTheme}
					className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					{theme === 'dark' ? (
						<FiSun className="h-5 w-5" />
					) : (
						<FiMoon className="h-5 w-5" />
					)}
				</button>
			)}
		</header>
	)
}
