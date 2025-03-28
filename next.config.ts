import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: true,
	experimental: {
		// appDir is now the default in newer Next.js versions
	},
	images: {
		domains: ['localhost'], // Sesuaikan dengan domain Anda
	},
}

export default nextConfig
