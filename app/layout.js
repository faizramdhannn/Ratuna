import './globals.css'

export const metadata = {
  title: 'Ratuna System',
  icons: "/Logo_Ratuna.png",
  description: 'Sistem Manajemen Kasir Profesional',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}