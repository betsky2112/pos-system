'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import axios from 'axios'
import toast from 'react-hot-toast'
import {FiSave, FiUpload, FiX} from 'react-icons/fi'
import Image from 'next/image'
import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'

// Schema validasi
const productSchema = z.object({
	name: z.string().min(1, 'Nama produk harus diisi'),
	description: z.string().optional(),
	price: z
		.string()
		.min(1, 'Harga harus diisi')
		.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
			message: 'Harga harus berupa angka positif',
		}),
	stock: z
		.string()
		.min(1, 'Stok harus diisi')
		.refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
			message: 'Stok harus berupa angka non-negatif',
		}),
	categoryId: z.string().min(1, 'Kategori harus dipilih'),
	image: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

// Tipe data kategori
type Category = {
	id: string
	name: string
}

export default function CreateProductPage() {
	const router = useRouter()
	const {user, isAdmin} = useAuth()
	const [categories, setCategories] = useState<Category[]>([])
	const [loading, setLoading] = useState(false)
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [uploadLoading, setUploadLoading] = useState(false)

	// Form handling
	const {
		register,
		handleSubmit,
		formState: {errors},
		setValue,
		watch,
	} = useForm<ProductFormValues>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			name: '',
			description: '',
			price: '',
			stock: '',
			categoryId: '',
			image: '',
		},
	})

	// Redirect if not admin
	useEffect(() => {
		if (user && !isAdmin) {
			toast.error('Anda tidak memiliki akses ke halaman ini')
			router.push('/products')
		}
	}, [user, isAdmin, router])

	// Fetch categories
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await axios.get('/api/categories')
				setCategories(response.data)
			} catch (error) {
				console.error('Error fetching categories:', error)
				toast.error('Gagal memuat data kategori')
			}
		}

		fetchCategories()
	}, [])

	// Handle image upload
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null
		if (!file) return

		// Validasi tipe file
		const validTypes = [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif',
		]
		if (!validTypes.includes(file.type)) {
			toast.error(
				'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF'
			)
			return
		}

		// Validasi ukuran file (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Ukuran file terlalu besar. Maksimal 5MB')
			return
		}

		setImageFile(file)

		// Generate preview
		const reader = new FileReader()
		reader.onloadend = () => {
			setImagePreview(reader.result as string)
		}
		reader.readAsDataURL(file)
	}

	// Upload image
	const uploadImage = async () => {
		if (!imageFile) return null

		setUploadLoading(true)
		const formData = new FormData()
		formData.append('file', imageFile)

		try {
			const response = await axios.post('/api/upload', formData)
			return response.data.url
		} catch (error) {
			console.error('Error uploading image:', error)
			throw new Error('Gagal mengupload gambar')
		} finally {
			setUploadLoading(false)
		}
	}

	// Remove image
	const removeImage = () => {
		setImageFile(null)
		setImagePreview(null)
		setValue('image', '')
	}

	// Handle form submit
	const onSubmit = async (data: ProductFormValues) => {
		setLoading(true)

		try {
			// Upload image first if selected
			let imageUrl = ''
			if (imageFile) {
				imageUrl = (await uploadImage()) || ''
				data.image = imageUrl
			}

			// Create product
			await axios.post('/api/products', {
				...data,
				price: parseFloat(data.price),
				stock: parseInt(data.stock),
			})

			toast.success('Produk berhasil ditambahkan')
			router.push('/products')
		} catch (error: any) {
			console.error('Error creating product:', error)
			toast.error(
				error.response?.data?.error || 'Gagal menambahkan produk'
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					Tambah Produk Baru
				</h1>
				<Link
					href="/products"
					className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
				>
					Kembali ke Daftar Produk
				</Link>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-6"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-4">
							{/* Nama Produk */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Nama Produk *
								</label>
								<input
									type="text"
									{...register('name')}
									className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									placeholder="Masukkan nama produk"
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.name.message}
									</p>
								)}
							</div>

							{/* Deskripsi */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Deskripsi
								</label>
								<textarea
									{...register('description')}
									rows={3}
									className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									placeholder="Masukkan deskripsi produk (opsional)"
								/>
								{errors.description && (
									<p className="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.description.message}
									</p>
								)}
							</div>

							{/* Kategori */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Kategori *
								</label>
								<select
									{...register('categoryId')}
									className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<option value="">Pilih Kategori</option>
									{categories.map((category) => (
										<option
											key={category.id}
											value={category.id}
										>
											{category.name}
										</option>
									))}
								</select>
								{errors.categoryId && (
									<p className="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.categoryId.message}
									</p>
								)}
							</div>

							{/* Harga dan Stok */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Harga *
									</label>
									<input
										type="text"
										{...register('price')}
										className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
										placeholder="Rp"
									/>
									{errors.price && (
										<p className="mt-1 text-sm text-red-600 dark:text-red-400">
											{errors.price.message}
										</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Stok *
									</label>
									<input
										type="text"
										{...register('stock')}
										className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
										placeholder="0"
									/>
									{errors.stock && (
										<p className="mt-1 text-sm text-red-600 dark:text-red-400">
											{errors.stock.message}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Gambar Produk */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Gambar Produk
							</label>
							<div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
								{imagePreview ? (
									<div className="space-y-2 text-center">
										<div className="relative h-40 w-40 mx-auto">
											<Image
												src={imagePreview}
												alt="Preview"
												fill
												sizes="(max-width: 768px) 100vw, 200px"
												className="object-contain rounded-md"
											/>
											<button
												type="button"
												onClick={removeImage}
												className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800"
											>
												<FiX size={16} />
											</button>
										</div>
										<div className="text-sm text-gray-500 dark:text-gray-400">
											{imageFile?.name}
										</div>
									</div>
								) : (
									<div className="space-y-1 text-center">
										<svg
											className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
											stroke="currentColor"
											fill="none"
											viewBox="0 0 48 48"
											aria-hidden="true"
										>
											<path
												d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
												strokeWidth={2}
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<div className="flex text-sm text-gray-600 dark:text-gray-400">
											<label
												htmlFor="file-upload"
												className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
											>
												<span>Upload gambar</span>
												<input
													id="file-upload"
													name="file-upload"
													type="file"
													className="sr-only"
													accept="image/*"
													onChange={handleImageChange}
												/>
											</label>
											<p className="pl-1">
												atau drag and drop
											</p>
										</div>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											PNG, JPG, WEBP atau GIF sampai 5MB
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Tombol Submit */}
					<div className="flex justify-end space-x-4">
						<Link
							href="/products"
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
						>
							Batal
						</Link>
						<button
							type="submit"
							disabled={loading || uploadLoading}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
						>
							{loading || uploadLoading ? (
								<span className="flex items-center">
									<svg
										className="w-4 h-4 mr-2 animate-spin"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
											fill="none"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Menyimpan...
								</span>
							) : (
								<span className="flex items-center">
									<FiSave className="mr-2" />
									Simpan Produk
								</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
