import './globals.css'
import LayoutContent from '@/src/components/LayoutContent'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <LayoutContent>
          {children}
        </LayoutContent>
      </body>
    </html>
  )
}