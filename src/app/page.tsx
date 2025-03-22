import {redirect} from 'next/navigation'

export default function Home() {
	// Redirect ke dashboard
	redirect('/dashboard')
}
