import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'XDeleter - Bulk Delete Your Tweets',
  description: 'Clean your Twitter/X history in seconds. Bulk delete tweets with our fast, secure, and easy-to-use tool.',
  keywords: 'twitter, x, delete tweets, bulk delete, tweet cleaner, twitter cleaner',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <script src="https://gumroad.com/js/gumroad.js" async></script>
      </body>
    </html>
  )
}
