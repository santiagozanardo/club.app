'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SessionTimeout() {
  const router = useRouter()

  const timeoutRef = useRef<NodeJS.Timeout | null>(
    null
  )

  const TIEMPO_INACTIVIDAD =
    10 * 1000 // 30 minutos

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(
      async () => {
        alert(
          'La sesión expiró por inactividad'
        )

        await supabase.auth.signOut()

        router.push('/')
      },
      TIEMPO_INACTIVIDAD
    )
  }

  useEffect(() => {
    resetTimer()

    const eventos = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart'
    ]

    eventos.forEach((e) =>
      window.addEventListener(
        e,
        resetTimer
      )
    )

    return () => {
      eventos.forEach((e) =>
        window.removeEventListener(
          e,
          resetTimer
        )
      )

      if (timeoutRef.current) {
        clearTimeout(
          timeoutRef.current
        )
      }
    }
  }, [])

  return null
}
