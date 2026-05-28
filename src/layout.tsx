'use client'

import { useState } from 'react'
import Sidebar from '@/src/components/Sidebar'
import { ClienteProvider } from '@/src/context/ClienteContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-100">

        {/* 🔥 HAMBURGUESA GLOBAL (SIEMPRE VISIBLE) */}
        <div className="fixed top-0 left-0 right-0 h-12 bg-white shadow flex items-center px-4 z-[9999]">
          <button
            onClick={() => setOpen(true)}
            className="text-2xl md:hidden"
          >
            ☰
          </button>
        </div>

        {/* SIDEBAR MOBILE */}
        {open && (
          <div className="fixed inset-0 z-[9999] flex">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />

            <div className="relative w-64 bg-white h-full shadow-lg">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white shadow">
          <Sidebar />
        </div>

        {/* CONTENIDO */}
        <div className="md:ml-64 pt-12">
          {children}
        </div>

      </body>
    </html>
  )
}


