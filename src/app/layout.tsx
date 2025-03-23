import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import {Providers} from './providers'
import Script from 'next/script'

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

				{/* Debug script */}
				<Script
					id="cookie-watcher"
					strategy="afterInteractive"
				>
					{`
            // Watch for cookie changes
            (function() {
              let lastCookies = document.cookie;
              
              setInterval(() => {
                const currentCookies = document.cookie;
                if (currentCookies !== lastCookies) {
                  console.log('Cookies changed!');
                  console.log('Previous:', lastCookies);
                  console.log('Current:', currentCookies);
                  lastCookies = currentCookies;
                  
                  // Check if token cookie is gone
                  if (!document.cookie.includes('token=')) {
                    console.log('Token cookie removed, redirecting to login');
                  }
                }
              }, 1000);
            })();
          `}
				</Script>
			</body>
		</html>
	)
}
