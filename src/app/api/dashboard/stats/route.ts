import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {getAuthToken, verifyJwtToken} from '@/lib/auth'

export async function GET(req: NextRequest) {
	try {
		// Verifikasi auth
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await verifyJwtToken(token)

		// Dapatkan total revenue
		const totalRevenue = await prisma.transaction.aggregate({
			_sum: {
				total: true,
			},
		})

		// Dapatkan total transaksi
		const totalTransactions = await prisma.transaction.count()

		// Dapatkan total produk
		const totalProducts = await prisma.product.count()

		// Dapatkan penjualan harian (7 hari terakhir)
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

		const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "date") as date,
        SUM(total) as total
      FROM "Transaction"
      WHERE "date" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "date")
      ORDER BY date ASC
    `

		// Dapatkan penjualan mingguan (4 minggu terakhir)
		const fourWeeksAgo = new Date()
		fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

		const weeklySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', "date") as week,
        SUM(total) as total
      FROM "Transaction"
      WHERE "date" >= ${fourWeeksAgo}
      GROUP BY DATE_TRUNC('week', "date")
      ORDER BY week ASC
    `

		// Dapatkan penjualan bulanan (6 bulan terakhir)
		const sixMonthsAgo = new Date()
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

		const monthlySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "date") as month,
        SUM(total) as total
      FROM "Transaction"
      WHERE "date" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "date")
      ORDER BY month ASC
    `

		// Dapatkan produk terlaris
		const topProducts = await prisma.transactionItem.groupBy({
			by: ['productId'],
			_sum: {
				quantity: true,
				price: true,
			},
			orderBy: {
				_sum: {
					quantity: 'desc',
				},
			},
			take: 5,
		})

		// Dapatkan detail produk terlaris
		const topProductsWithDetails = await Promise.all(
			topProducts.map(async (item) => {
				const product = await prisma.product.findUnique({
					where: {id: item.productId},
					select: {id: true, name: true},
				})

				return {
					id: product?.id || '',
					name: product?.name || '',
					total: item._sum.price || 0,
				}
			})
		)

		// Format data untuk respons
		return NextResponse.json({
			totalRevenue: totalRevenue._sum.total || 0,
			totalTransactions,
			totalProducts,
			dailySales: (dailySales as any[]).map((day: any) => ({
				date: day.date.toISOString().split('T')[0],
				total: Number(day.total),
			})),
			weeklySales: (weeklySales as any[]).map((week: any) => ({
				week: `Minggu ${week.week
					.toISOString()
					.split('T')[0]
					.slice(5, 10)}`,
				total: Number(week.total),
			})),
			monthlySales: (monthlySales as any[]).map((month: any) => ({
				month: `${month.month.toLocaleString('id-ID', {
					month: 'long',
				})} ${month.month.getFullYear()}`,
				total: Number(month.total),
			})),
			topProducts: topProductsWithDetails,
		})
	} catch (error) {
		console.error('Dashboard stats error:', error)
		return NextResponse.json(
			{error: 'Terjadi kesalahan pada server'},
			{status: 500}
		)
	}
}
