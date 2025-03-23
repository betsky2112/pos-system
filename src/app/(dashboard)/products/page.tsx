'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import {FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter} from 'react-icons/fi'
import Image from 'next/image'
import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'
import {formatCurrency} from '@/lib/utils'
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal'

// Tipe data
type Product = {
	id: string
	name: string
	description: string | null
	price: number
	stock: number
	image: string | null
	categoryId: string
	category: {
		id: string
		name: string
	}
}

type Category = {
	id: string
	name: string
}

type PaginationInfo = {
	page: number
	limit: number
	totalItems: number
	totalPages: number
}

// Component
export default function ProductsPage() {
	const router = useRouter()
	const {isAdmin} = useAuth()

	// State untuk produk dan filter
	const [products, setProducts] = useState<Product[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')
	const [pagination, setPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 10,
		totalItems: 0,
		totalPages: 0,
	})

	// State untuk modal konfirmasi delete
	const [deleteModalOpen, setDeleteModalOpen] = useState(false)
	const [productToDelete, setProductToDelete] = useState<Product | null>(null)

	// Fungsi untuk mengambil data produk
	const fetchProducts = async () => {
		setLoading(true)
		try {
			let url = `/api/products?page=${pagination.page}&limit=${pagination.limit}`

			if (searchTerm) {
				url += `&search=${encodeURIComponent(searchTerm)}`
			}

			if (selectedCategory) {
				url += `&categoryId=${selectedCategory}`
			}

			const response = await axios.get(url)
			setProducts(response.data.products)
			setPagination(response.data.pagination)
		} catch (error) {
			console.error('Error fetching products:', error)
			toast.error('Gagal memuat data produk')
		} finally {
			setLoading(false)
		}
	}

	// Fungsi untuk mengambil data kategori
	const fetchCategories = async () => {
		try {
			const response = await axios.get('/api/categories')
			setCategories(response.data)
		} catch (error) {
			console.error('Error fetching categories:', error)
			toast.error('Gagal memuat data kategori')
		}
	}

	// Load data awal
	useEffect(() => {
		fetchCategories()
		fetchProducts()
	}, [pagination.page, pagination.limit])

	// Handle submit pencarian
	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		pagination.page = 1 // Reset ke halaman pertama
		fetchProducts()
	}

	// Handle change category filter
	const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedCategory(e.target.value)
		pagination.page = 1 // Reset ke halaman pertama
		fetchProducts()
	}

	// Handle pagination
	const handlePageChange = (newPage: number) => {
		if (newPage > 0 && newPage <= pagination.totalPages) {
			setPagination((prev) => ({...prev, page: newPage}))
		}
	}

	// Confirmation modal untuk delete
	const openDeleteModal = (product: Product) => {
		setProductToDelete(product)
		setDeleteModalOpen(true)
	}

	// Handle delete produk
	const handleDeleteProduct = async () => {
		if (!productToDelete) return

		try {
			await axios.delete(`/api/products/${productToDelete.id}`)
			toast.success('Produk berhasil dihapus')
			fetchProducts() // Refresh data
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.error || 'Gagal menghapus produk'
			toast.error(errorMessage)
		} finally {
			setDeleteModalOpen(false)
			setProductToDelete(null)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					Manajemen Produk
				</h1>

				{isAdmin && (
					<Link
						href="/products/create"
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
					>
						<FiPlus />
						<span>Tambah Produk</span>
					</Link>
				)}
			</div>

			{/* Filter dan Pencarian */}
			<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1">
						<form
							onSubmit={handleSearch}
							className="flex"
						>
							<div className="relative flex-1">
								<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
									<FiSearch className="text-gray-400" />
								</div>
								<input
									type="text"
									className="pl-10 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									placeholder="Cari produk..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
								/>
							</div>
							<button
								type="submit"
								className="ml-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
							>
								Cari
							</button>
						</form>
					</div>

					<div className="w-full md:w-64">
						<div className="relative">
							<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								<FiFilter className="text-gray-400" />
							</div>
							<select
								className="pl-10 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								value={selectedCategory}
								onChange={handleCategoryChange}
							>
								<option value="">Semua Kategori</option>
								{categories.map((category) => (
									<option
										key={category.id}
										value={category.id}
									>
										{category.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Tabel Produk */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
				{loading ? (
					<div className="flex justify-center items-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
					</div>
				) : products.length === 0 ? (
					<div className="text-center p-8 text-gray-500 dark:text-gray-400">
						Tidak ada produk ditemukan
					</div>
				) : (
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead className="bg-gray-50 dark:bg-gray-700">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
									Produk
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
									Kategori
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
									Harga
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
									Stok
								</th>
								{isAdmin && (
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Aksi
									</th>
								)}
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
							{products.map((product) => (
								<tr
									key={product.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center space-x-3">
											<div className="flex-shrink-0 h-10 w-10 relative">
												{product.image ? (
													<Image
														src={product.image}
														alt={product.name}
														fill
														sizes="40px"
														className="rounded-md object-cover"
													/>
												) : (
													<div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
														<span className="text-gray-500 dark:text-gray-400 text-xs">
															No img
														</span>
													</div>
												)}
											</div>
											<div>
												<div className="text-sm font-medium text-gray-900 dark:text-white">
													{product.name}
												</div>
												{product.description && (
													<div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
														{product.description}
													</div>
												)}
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
											{product.category.name}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
										{formatCurrency(product.price)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												product.stock > 10
													? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
													: product.stock > 0
													? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
													: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
											}`}
										>
											{product.stock}
										</span>
									</td>
									{isAdmin && (
										<td className="px-6 py-4 whitespace-nowrap text-center text-sm">
											<div className="flex justify-center space-x-2">
												<Link
													href={`/products/edit/${product.id}`}
													className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
												>
													<FiEdit2 size={18} />
												</Link>
												<button
													onClick={() =>
														openDeleteModal(product)
													}
													className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
												>
													<FiTrash2 size={18} />
												</button>
											</div>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<div className="flex justify-between items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
					<div className="text-sm text-gray-700 dark:text-gray-300">
						Menampilkan{' '}
						<span className="font-medium">
							{(pagination.page - 1) * pagination.limit + 1}
						</span>
						{' - '}
						<span className="font-medium">
							{Math.min(
								pagination.page * pagination.limit,
								pagination.totalItems
							)}
						</span>{' '}
						dari{' '}
						<span className="font-medium">
							{pagination.totalItems}
						</span>{' '}
						produk
					</div>
					<div className="flex space-x-2">
						<button
							onClick={() =>
								handlePageChange(pagination.page - 1)
							}
							disabled={pagination.page === 1}
							className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600"
						>
							Sebelumnya
						</button>
						{Array.from(
							{length: pagination.totalPages},
							(_, i) => i + 1
						).map((page) => (
							<button
								key={page}
								onClick={() => handlePageChange(page)}
								className={`px-3 py-1 border rounded-md text-sm ${
									pagination.page === page
										? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700'
										: 'dark:border-gray-600'
								}`}
							>
								{page}
							</button>
						))}
						<button
							onClick={() =>
								handlePageChange(pagination.page + 1)
							}
							disabled={pagination.page === pagination.totalPages}
							className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600"
						>
							Selanjutnya
						</button>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteConfirmModal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				onConfirm={handleDeleteProduct}
				title="Hapus Produk"
				message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
			/>
		</div>
	)
}
