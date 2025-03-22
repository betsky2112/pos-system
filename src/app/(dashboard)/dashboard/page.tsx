'use client'

import {useEffect, useState} from 'react'
import axios from 'axios'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import {FiDollarSign, FiShoppingCart, FiShoppingBag} from 'react-icons/fi'

// Tipe data untuk dashboard stats
type DashboardStats = {
	totalRevenue: number
	totalTransactions: number
	totalProducts: number
	dailySales: {date: string; total: number}[]
	weeklySales: {week: string; total: number}[]
	monthlySales: {month: string; total: number}[]
	topProducts: {id: string; name: string; total: number}[]
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [timespan, setTimespan] = useState<'daily' | 'weekly' | 'monthly'>(
		'daily'
	)

	// Fetch dashboard data
	useEffect(() => {
		const fetchDashboardStats = async () => {
			try {
				setLoading(true)
				const response = await axios.get('/api/dashboard/stats')
				setStats(response.data)
				setError(null)
			} catch (err) {
				setError('Gagal memuat data dashboard')
				console.error(err)
			} finally {
				setLoading(false)
			}
		}

		fetchDashboardStats()
	}, [])

	// Format currency
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
		}).format(value)
	}

	// Data chart berdasarkan timespan
	const getChartData = () => {
		if (!stats) return []

		switch (timespan) {
			case 'daily':
				return stats.dailySales.map((item) => ({
					name: item.date,
					total: item.total,
				}))
			case 'weekly':
				return stats.weeklySales.map((item) => ({
					name: item.week,
					total: item.total,
				}))
			case 'monthly':
				return stats.monthlySales.map((item) => ({
					name: item.month,
					total: item.total,
				}))
			default:
				return []
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-80">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
				<p className="text-red-600 dark:text-red-400">{error}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
				Dashboard
			</h1>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
					<div className="flex items-center space-x-4">
						<div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
							<FiDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Pendapatan
							</p>
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">
								{stats
									? formatCurrency(stats.totalRevenue)
									: '-'}
							</h3>
						</div>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
					<div className="flex items-center space-x-4">
						<div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
							<FiShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Transaksi
							</p>
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">
								{stats ? stats.totalTransactions : '-'}
							</h3>
						</div>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
					<div className="flex items-center space-x-4">
						<div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
							<FiShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Produk
							</p>
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">
								{stats ? stats.totalProducts : '-'}
							</h3>
						</div>
					</div>
				</div>
			</div>

			{/* Sales Chart */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-800 dark:text-white">
						Grafik Penjualan
					</h2>
					<div className="flex space-x-2">
						<button
							onClick={() => setTimespan('daily')}
							className={`px-3 py-1 text-sm rounded-md ${
								timespan === 'daily'
									? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
									: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
							}`}
						>
							Harian
						</button>
						<button
							onClick={() => setTimespan('weekly')}
							className={`px-3 py-1 text-sm rounded-md ${
								timespan === 'weekly'
									? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
									: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
							}`}
						>
							Mingguan
						</button>
						<button
							onClick={() => setTimespan('monthly')}
							className={`px-3 py-1 text-sm rounded-md ${
								timespan === 'monthly'
									? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
									: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
							}`}
						>
							Bulanan
						</button>
					</div>
				</div>

				<div className="h-80">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<BarChart data={getChartData()}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip
								formatter={(value) =>
									formatCurrency(value as number)
								}
								labelFormatter={(label) => `Periode: ${label}`}
							/>
							<Legend />
							<Bar
								dataKey="total"
								name="Total Penjualan"
								fill="#4F46E5"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Top Products */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
				<h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
					Produk Terlaris
				</h2>

				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead>
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
									Produk
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
									Total Penjualan
								</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
							{stats?.topProducts.map((product) => (
								<tr key={product.id}>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
										{product.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
										{formatCurrency(product.total)}
									</td>
								</tr>
							))}

							{stats?.topProducts.length === 0 && (
								<tr>
									<td
										colSpan={2}
										className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-center"
									>
										Belum ada data produk terlaris
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
