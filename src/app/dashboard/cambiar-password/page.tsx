'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export default function CambiarPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const cambiarPassword = async () => {
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    alert('Contraseña actualizada correctamente')

    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      <div className="p-8">
        <div className="bg-white rounded-2xl shadow p-6 max-w-xl">
          <h1 className="text-3xl font-bold mb-6">
            Cambiar contraseña
          </h1>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />

            <input
              type="password"
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />

            <button
              onClick={cambiarPassword}
              className="bg-black text-white px-6 py-3 rounded-xl"
            >
              Guardar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}