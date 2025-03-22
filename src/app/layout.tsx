import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import {Providers} from './providers'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
	title: 'POS System',
	description: 'Point of Sale System built with Next.js',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html
			lang="id"
			suppressHydrationWarning
		>
			<body className={inter.className}>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
