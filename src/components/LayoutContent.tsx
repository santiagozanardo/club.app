'use client'

import { usePathname } from 'next/navigation'
import Topbar from '@/src/components/Topbar'
import SessionTimeout from '@/src/components/SessionTimeout'

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
      {!hideTopbar && (
        <>
          <SessionTimeout />
          <Topbar />
        </>
      )}

      <main className={!hideTopbar ? 'pt-16' : ''}>
        {children}
      </main>
    </>
  )
}
