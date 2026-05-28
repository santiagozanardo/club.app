'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export default function MisDatosPage() {
  const [persona, setPersona] = useState<any>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select(`
        personaid,
        persona:personaid (
          nombre,
          apellido,
          mail,
          rol
        )
      `)
      .eq('id', user.id)
      .single()

    if (data) {
      setPersona(data.persona)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      <div className="p-8">
        <div className="bg-white rounded-2xl shadow p-6 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">
            Mis datos personales
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">
                Nombre
              </label>

              <div className="font-semibold">
                {persona?.nombre}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Apellido
              </label>

              <div className="font-semibold">
                {persona?.apellido}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Mail
              </label>

              <div className="font-semibold">
                {persona?.mail}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Rol
              </label>

              <div className="font-semibold">
                {persona?.rol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}