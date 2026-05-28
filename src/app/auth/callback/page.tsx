'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Obtener usuario autenticado
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/')
          return
        }

        // Verificar si ya existe profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        // Si NO existe → crear persona + profile
        if (!existingProfile) {
          // Crear persona
          const { data: personaData, error: personaError } =
            await supabase
              .from('persona')
              .insert({
                nombre: user.user_metadata.given_name || '',
                apellido: user.user_metadata.family_name || '',
                mail: user.email,
                rol
              })
              .select()
              .single()

          if (personaError) {
            console.error(personaError)
            router.push('/')
            return
          }

          // Crear profile
          const { error: profileError } =
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                clienteid: null,
                personaid: personaData.personaid
              })

          if (profileError) {
            console.error(profileError)
            router.push('/')
            return
          }
        }

        // Redireccionar al dashboard
        router.push('/dashboard')
        router.refresh()

      } catch (err) {
        console.error(err)
        router.push('/')
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Ingresando...</p>
    </div>
  )
}