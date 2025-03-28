'use client'

import {useState, useEffect} from 'react'
import {useRouter, useParams} from 'next/navigation'
import axios from 'axios'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import toast from 'react-hot-toast'
import {FiArrowLeft, FiUpload, FiX} from 'react-icons/fi'

// Tipe data untuk kategori
type Category = {
	id: string
	name: string
}

// Tipe data untuk produk
type Product = {
	id: string
	name: string
	description: string | null
	price: number
	stock: number
	image: string | null
	categoryId: string
}

// Schema validasi untuk produk
const productSchema = z.object({
	name: z.string().min(1, 'Nama produk wajib diisi'),
	description: z.string().optional(),
	price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
		message: 'Harga harus lebih dari 0',
	}),
	stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
		message: 'Stok tidak boleh negatif',
	}),
	categoryId: z.string().min(1, 'Kategori wajib dipilih'),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function EditProductPage() {
	const router = useRouter()
	const params = useParams()
	const {id} = params

	const [categories, setCategories] = useState<Category[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [currentImage, setCurrentImage] = useState<string | null>(null)
	const [uploadProgress, setUploadProgress] = useState(0)

	const {
		register,
		handleSubmit,
		formState: {errors},
		reset,
	} = useForm<ProductFormValues>({
		resolver: zodResolver(productSchema),
	})

	// Fetch product and categories
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true)
				const [productRes, categoriesRes] = await Promise.all([
					axios.get(`/api/products/${id}`),
					axios.get('/api/categories'),
				])

				const product = productRes.data
				setCategories(categoriesRes.data)
				if (product.image) {
					setCurrentImage(product.image)
				}

				reset({
					name: product.name,
					description: product.description || '',
					price: product.price.toString(),
					stock: product.stock.toString(),
					categoryId: product.categoryId,
				})
			} catch (error) {
				console.error('Error fetching data:', error)
				toast.error('Gagal memuat data')
				router.push('/products')
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [id, reset, router])

	// Handle image change
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Validate file type
		const allowedTypes = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/webp',
		]
		if (!allowedTypes.includes(file.type)) {
			toast.error(
				'Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP'
			)
			return
		}

		// Validate file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			toast.error('Ukuran file terlalu besar. Maksimal 2MB')
			return
		}

		setImageFile(file)

		// Create preview
		const reader = new FileReader()
		reader.onload = () => {
			setImagePreview(reader.result as string)
		}
		reader.readAsDataURL(file)
	}

	// Remove image
	const removeImage = () => {
		setImageFile(null)
		setImagePreview(null)
		if (currentImage) {
			setCurrentImage(null)
		}
		setUploadProgress(0)
	}

	// Submit form
	const onSubmit = async (data: ProductFormValues) => {
		try {
			setSubmitting(true)

			// Upload new image if exists
			let imageUrl = currentImage
			if (imageFile) {
				const formData = new FormData()
				formData.append('file', imageFile)

				const uploadResponse = await axios.post(
					'/api/upload',
					formData,
					{
						headers: {
							'Content-Type': 'multipart/form-data',
						},
						onUploadProgress: (progressEvent) => {
							const progress = progressEvent.total
								? Math.round(
										(progressEvent.loaded * 100) /
											progressEvent.total
								  )
								: 0
							setUploadProgress(progress)
						},
					}
				)

				imageUrl = uploadResponse.data.url
			}

			// Update product
			await axios.put(`/api/products/${id}`, {
				name: data.name,
				description: data.description || null,
				price: parseFloat(data.price),
				stock: parseInt(data.stock),
				categoryId: data.categoryId,
				image: imageUrl,
			})

			toast.success('Produk berhasil diperbarui')
			router.push('/products')
		} catch (error) {
			console.error('Error updating product:', error)
			toast.error('Gagal memperbarui produk')
		} finally {
			setSubmitting(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-80">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center">
				<button
					onClick={() => router.back()}
					className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					<FiArrowLeft className="h-5 w-5" />
				</button>
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					Edit Produk
				</h1>
			</div>

			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-6"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Nama Produk */}
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Nama Produk{' '}
								<span className="text-red-500">*</span>
							</label>
							<input
								id="name"
								type="text"
								{...register('name')}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
							{errors.name && (
								<p className="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.name.message}
								</p>
							)}
						</div>

						{/* Kategori */}
						<div>
							<label
								htmlFor="categoryId"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Kategori <span className="text-red-500">*</span>
							</label>
							<select
								id="categoryId"
								{...register('categoryId')}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

						{/* Harga */}
						<div>
							<label
								htmlFor="price"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Harga <span className="text-red-500">*</span>
							</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span className="text-gray-500 dark:text-gray-400 sm:text-sm">
										Rp
									</span>
								</div>
								<input
									id="price"
									type="text"
									{...register('price')}
									className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								/>
							</div>
							{errors.price && (
								<p className="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.price.message}
								</p>
							)}
						</div>

						{/* Stok */}
						<div>
							<label
								htmlFor="stock"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Stok <span className="text-red-500">*</span>
							</label>
							<input
								id="stock"
								type="text"
								{...register('stock')}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
							{errors.stock && (
								<p className="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.stock.message}
								</p>
							)}
						</div>
					</div>

					{/* Deskripsi */}
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Deskripsi
						</label>
						<textarea
							id="description"
							rows={3}
							{...register('description')}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						/>
						{errors.description && (
							<p className="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.description.message}
							</p>
						)}
					</div>

					{/* Upload Gambar */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Gambar Produk
						</label>
						<div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
							<div className="space-y-1 text-center">
								{imagePreview || currentImage ? (
									<div className="relative">
										<img
											src={
												imagePreview ||
												currentImage ||
												''
											}
											alt="Preview"
											className="mx-auto h-32 w-auto rounded-md"
										/>
										<button
											type="button"
											onClick={removeImage}
											className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-800/40"
										>
											<FiX className="h-4 w-4" />
										</button>

										{/* Progress bar */}
										{uploadProgress > 0 &&
											uploadProgress < 100 && (
												<div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
													<div
														className="bg-blue-600 h-2 rounded-full"
														style={{
															width: `${uploadProgress}%`,
														}}
													></div>
												</div>
											)}
									</div>
								) : (
									<>
										<FiUpload className="mx-auto h-12 w-12 text-gray-400" />
										<div className="flex text-sm text-gray-600 dark:text-gray-400">
											<label
												htmlFor="file-upload"
												className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus-within:outline-none"
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
												atau seret dan lepas
											</p>
										</div>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											PNG, JPG, GIF sampai 2MB
										</p>
									</>
								)}
							</div>
						</div>
					</div>

					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => router.back()}
							className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
