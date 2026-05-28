'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Bienvenido
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Iniciá sesión o creá una cuenta
        </p>

        <AuthForm />
      </div>
    </div>
  )
}

function AuthForm() {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rol, setRol] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')

      if (!isLogin) {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (!data.user) {
          throw new Error('No se pudo crear el usuario')
        }

        // CREAR PERSONA
        const { data: personaData, error: personaError } =
          await supabase
            .from('persona')
            .insert({
              nombre,
              apellido,
              dni,
              telefono,
              mail: email,
              rol
            })
            .select()
            .single()

        if (personaError) throw personaError

        // CREAR PROFILE
        const { error: profileError } =
          await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              clienteid: null,
              personaid: personaData.personaid
            })

        if (profileError) throw profileError
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      }

      router.push('/dashboard')
      router.refresh()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (

  <div className="space-y-6">

    <div className="flex flex-col items-center">

      <img
        src="/img/logosinfondo.png"
        alt="club.app"
        className="w-32 h-32 object-contain mb-4"
      />

      <h1 className="text-4xl font-bold text-center">
        club.app
      </h1>

      <p className="text-gray-500 text-center mt-2">
        tu club, en un solo lugar
      </p>

    </div>

    <form onSubmit={handleSubmit} className="space-y-4">

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="
          w-full
          border
          rounded-xl
          px-4
          py-3
          focus:outline-none
          focus:ring-2
          focus:ring-black
        "
        required
      />

      <div className="relative">

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full
            border
            rounded-xl
            px-4
            py-3
            pr-14
            focus:outline-none
            focus:ring-2
            focus:ring-black
          "
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            cursor-pointer
            hover:scale-110
            transition
            duration-200
          "
        >

          <img
            src="/img/pw.png"
            alt="Mostrar contraseña"
            className="w-10 h-10 object-contain pointer-events-none"
          />

        </button>

      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          bg-black
          hover:bg-gray-800
          transition
          duration-200
          text-white
          py-3
          rounded-xl
          font-semibold
          cursor-pointer
          disabled:opacity-50
        "
      >
        {loading
          ? 'Cargando...'
          : 'Iniciar sesión'}
      </button>

    </form>

    <div className="text-center">

      <button
        type="button"
        onClick={() => router.push('/forgot-password')}
        className="
          text-sm
          text-blue-600
          underline
          hover:text-blue-800
          transition
          duration-200
          cursor-pointer
        "
      >
        ¿Olvidaste tu contraseña?
      </button>

    </div>

  </div>
)
}