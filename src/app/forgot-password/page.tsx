'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (!error) setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">

        <h1 className="text-xl font-bold mb-4">
          Recuperar contraseña
        </h1>

        <input
          type="email"
          placeholder="Tu email"
          className="w-full border p-3 rounded mb-4"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-black text-white p-3 rounded"
        >
          Enviar link
        </button>

        {sent && (
          <p className="text-green-600 mt-4 text-sm">
            Te enviamos un mail para resetear tu contraseña
          </p>
        )}
      </div>
    </div>
  )
}