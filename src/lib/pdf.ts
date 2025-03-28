import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Product = {
	name: string
	price: number
}

type TransactionItem = {
	product: Product
	quantity: number
}

type TransactionData = {
	items: TransactionItem[]
	total: number
	date: string
}

export const generateReceiptPDF = (data: TransactionData) => {
	const doc = new jsPDF()

	doc.text('Struk Transaksi', 14, 20)

	autoTable(doc, {
		startY: 30,
		head: [['Produk', 'Harga', 'Jumlah', 'Subtotal']],
		body: data.items.map((item) => {
			const product = item.product || {} // Tambahkan pemeriksaan ini
			return [
				product.name || 'Produk tidak ditemukan', // Periksa jika product.name ada
				`Rp${product.price || 0}`,
				item.quantity,
				`Rp${(product.price || 0) * item.quantity}`,
			]
		}),
	})

	const finalY = (doc as any).lastAutoTable.finalY || 30
	doc.text(`Total: Rp${data.total}`, 14, finalY + 10)
	doc.text(`Tanggal: ${data.date}`, 14, finalY + 20)

	doc.save('receipt.pdf')
}
