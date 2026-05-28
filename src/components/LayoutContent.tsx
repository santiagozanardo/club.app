'use client'

import { usePathname } from 'next/navigation'
import Topbar from '@/src/components/Topbar'

export default function LayoutContent({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const hideTopbar =
    pathname === '/' ||
    pathname === '/forgot-password'

  return (
    <>
      {!hideTopbar && <Topbar />}

      <main className={!hideTopbar ? 'pt-16' : ''}>
        {children}
      </main>
    </>
  )
}