'use client'

import {useState, useEffect} from 'react'
import {useForm, Controller} from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'
import {FiPlus, FiTrash2} from 'react-icons/fi'
import {generateReceiptPDF} from '@/lib/pdf'

// Tipe data untuk produk
type Product = {
	id: string
	name: string
	price: number
	stock: number
}

type TransactionItem = {
	productId: string
	quantity: number
}

type TransactionFormValues = {
	items: TransactionItem[]
}

export default function TransactionPage() {
	const [products, setProducts] = useState<Product[]>([])
	const [total, setTotal] = useState(0)
	const {control, handleSubmit, watch, setValue} =
		useForm<TransactionFormValues>({
			defaultValues: {
				items: [{productId: '', quantity: 1}],
			},
		})

	// Fetch products
	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await axios.get('/api/products')
				setProducts(response.data.products)
			} catch (error) {
				console.error('Error fetching products:', error)
				toast.error('Gagal memuat data produk')
			}
		}

		fetchProducts()
	}, [])

	// Calculate total
	const calculateTotal = (
		items: TransactionItem[],
		products: Product[]
	): number => {
		let total = 0
		items.forEach((item) => {
			const product = products.find((p) => p.id === item.productId)
			if (product) {
				total += product.price * item.quantity
			}
		})
		console.log('Calculated Total:', total)
		return total
	}

	// Watch for changes in the form and recalculate total
	const items = watch('items')
	useEffect(() => {
		const newTotal = calculateTotal(items, products)
		setTotal(newTotal)
	}, [items, products])

	// Handle form submission
	const onSubmit = async (data: TransactionFormValues) => {
		try {
			// Calculate total before generating PDF
			const newTotal = calculateTotal(data.items, products)
			setTotal(newTotal)

			// Process transaction (e.g., save to database)
			console.log('Transaction data:', data)
			toast.success('Transaksi berhasil diproses')

			// Generate PDF receipt
			const transactionData = {
				items: data.items.map((item) => {
					const product = products.find(
						(p) => p.id === item.productId
					)
					return {
						product: product || {
							name: 'Produk tidak ditemukan',
							price: 0,
						},
						quantity: item.quantity,
					}
				}),
				total: newTotal,
				date: new Date().toLocaleString(),
			}
			generateReceiptPDF(transactionData)
		} catch (error) {
			console.error('Error processing transaction:', error)
			toast.error('Gagal memproses transaksi')
		}
	}

	// Add new item to the form
	const addItem = () => {
		const newItems = [...items, {productId: '', quantity: 1}]
		setValue('items', newItems)
	}

	// Remove item from the form
	const removeItem = (index: number) => {
		const newItems = items.filter((_, i) => i !== index)
		setValue('items', newItems)
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
				Proses Transaksi
			</h1>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="space-y-6"
			>
				{items.map((item, index) => (
					<div
						key={index}
						className="flex items-center space-x-4"
					>
						<Controller
							name={`items.${index}.productId`}
							control={control}
							render={({field}) => (
								<select
									{...field}
									className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<option value="">Pilih Produk</option>
									{products.map((product) => (
										<option
											key={product.id}
											value={product.id}
										>
											{product.name} - Rp{product.price}
										</option>
									))}
								</select>
							)}
						/>
						<Controller
							name={`items.${index}.quantity`}
							control={control}
							render={({field}) => (
								<input
									{...field}
									type="number"
									min="1"
									className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								/>
							)}
						/>
						<button
							type="button"
							onClick={() => removeItem(index)}
							className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<FiTrash2 className="h-5 w-5 text-red-500" />
						</button>
					</div>
				))}

				<button
					type="button"
					onClick={addItem}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
				>
					<FiPlus />
					<span>Tambah Produk</span>
				</button>

				<div className="text-lg font-bold">Total: Rp{total}</div>

				<button
					type="submit"
					className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
				>
					Proses Transaksi
				</button>
			</form>
		</div>
	)
}
