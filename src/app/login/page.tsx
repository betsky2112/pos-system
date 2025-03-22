'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import toast from 'react-hot-toast'
import {useAuthStore} from '@/store/authStore'

// Validasi form
const loginSchema = z.object({
	email: z.string().email('Email tidak valid'),
	password: z.string().min(1, 'Password harus diisi'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const {login, error, clearError} = useAuthStore()

	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
	})

	const onSubmit = async (data: LoginFormValues) => {
		setIsLoading(true)
		clearError() // Clear any previous errors

		try {
			await login(data.email, data.password)
			toast.success('Login berhasil!')

			// Penting: Tambahkan timeout untuk memastikan navigasi terjadi setelah state terupdate
			setTimeout(() => {
				router.push('/dashboard')
				router.refresh()
			}, 100)
		} catch (error: any) {
			toast.error(error.message || 'Terjadi kesalahan login')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
			<div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Login
					</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						Masuk ke akun POS Anda
					</p>
				</div>

				<form
					className="mt-8 space-y-6"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="email"
							{...register('email')}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-red-600">
								{errors.email.message}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							autoComplete="current-password"
							{...register('password')}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-red-600">
								{errors.password.message}
							</p>
						)}
					</div>

					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
							<p className="text-sm text-red-600 dark:text-red-400">
								{error}
							</p>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? 'Loading...' : 'Login'}
						</button>
					</div>
				</form>

				<div className="text-center mt-4">
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Belum punya akun?{' '}
						<Link
							href="/register"
							className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
						>
							Register
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}
