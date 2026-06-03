'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'


export default function Topbar() {
  const router = useRouter()


  const [menuOpen, setMenuOpen] =
    useState(false)

  const [adminOpen, setAdminOpen] =
    useState(true)

  const [perfilOpen, setPerfilOpen] =
    useState(false)

  const [clienteNombre, setClienteNombre] =
    useState('')

    const [esAdministrador, setEsAdministrador] =
    useState(false)

  useEffect(() => {
    cargarCliente()
  }, [])

  const cargarCliente = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser()
  
    if (!user) return
  
    const { data: profile } =
      await supabase
        .from('profiles')
        .select(`
          clienteid,
          personaid
        `)
        .eq('id', user.id)
        .single()
  
    if (!profile) return
  
    // ROL
    if (profile.personaid) {
  
      const { data: persona } =
        await supabase
          .from('persona')
          .select('rol')
          .eq(
            'personaid',
            profile.personaid
          )
          .single()
  
      setEsAdministrador(
        persona?.rol ===
          'ADMINISTRADOR'
      )
    }
  
    // CLIENTE
    if (!profile?.clienteid) return
  
    const { data: cliente } =
      await supabase
        .from('cliente')
        .select('descripcion')
        .eq(
          'clienteid',
          profile.clienteid
        )
        .single()
  
    if (cliente?.descripcion) {
      setClienteNombre(
        cliente.descripcion
      )
    }
  }

  
  const handleLogout = async () => {
    setMenuOpen(false)
    setPerfilOpen(false)
    setAdminOpen(false)

    await supabase.auth.signOut()

    router.push('/')
    router.refresh()
  }

  const Item = ({
    href,
    label,
    icon
  }: any) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className="
        group
        flex
        items-center
        gap-3
        px-4
        py-3
        rounded-2xl
        transition-all
        hover:bg-gray-100
        active:scale-[0.98]
      "
    >
      <span className="text-lg">
        {icon}
      </span>

      <span className="text-sm font-medium text-gray-700 group-hover:text-black">
        {label}
      </span>
    </Link>
  )

  return (
    <>
      {/* TOPBAR */}
      <div
        className="
          fixed
          top-0
          left-0
          right-0
          h-16
          bg-white/90
          backdrop-blur
          border-b
          border-gray-200
          z-50
          flex
          items-center
          justify-between
          px-4
        "
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">

          {/* HAMBURGUESA */}
          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            className="
              w-11
              h-11
              rounded-2xl
              flex
              items-center
              justify-center
              text-xl
              hover:bg-gray-100
              transition
            "
          >
            ☰
          </button>

{/* LOGO */}
<div className="flex items-center gap-3">



  <div>
    <h1 className="text-lg font-bold tracking-tight leading-none">
      club.app
    </h1>

    {clienteNombre && (
      <div className="text-xs text-gray-400 mt-1 leading-none">
        {clienteNombre}
      </div>
    )}
  </div>



</div>
        </div>

        {/* RIGHT */}
        <img
    src="/img/logosinfondo.png"
    alt="club.app"
    className="h-15 w-15 object-contain"
  />
      </div>

      {/* MENU */}
      {menuOpen && (
        <>
          {/* OVERLAY */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() =>
              setMenuOpen(false)
            }
          />

          {/* SIDEBAR */}
          <div
            className="
            fixed
            top-16
            left-0
            w-72
            h-[calc(100vh-4rem)]
            bg-white/95
            backdrop-blur
            border-r
            shadow-2xl
            z-50
            overflow-y-auto
            p-4
            "
          >

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* ADMIN */}
              <div className="mb-4">

                <button
                  onClick={() =>
                    setAdminOpen(
                      !adminOpen
                    )
                  }
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3
                    rounded-2xl
                    hover:bg-gray-100
                    transition
                    font-medium
                    "
                >
                  <span className="font-semibold text-sm">
                    Administración
                  </span>

                  <span className="text-gray-400">
                    {adminOpen
                      ? '−'
                      : '+'}
                  </span>
                </button>

                {adminOpen && (
                <div className="ml-2 mt-2 space-y-1">

                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/home.png"
                        alt="home"
                        className="w-5 h-5 object-contain"
                    />

                    <span className="font-medium">
                        Home
                    </span>
                    </Link>
            {esAdministrador && (
                <Link
                    href="/dashboard/usuarios"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/usuario.png"
                        alt="usuarios"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Usuarios
                    </span>
                    </Link>
            )}
            {esAdministrador && (
                <Link
                    href="/dashboard/clientes"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/cliente.png"
                        alt="clientes"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Clientes
                    </span>
                    </Link>
            )}
{/*/}
                    <Link
                    href="/dashboard/sesiones"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/entrenamiento.png"
                        alt="entrenamientos"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Entrenamientos
                    </span>
                    </Link>

                    <Link
                    href="/dashboard/partidos"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/partido.png"
                        alt="partidos"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Partidos
                    </span>
                    </Link>
{/*/}

                    <Link
                    href="/dashboard/personas"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/personas.png"
                        alt="personas"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Personas
                    </span>
                    </Link>

                    <Link
                    href="/dashboard/planteles"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/planteles.png"
                        alt="planteles"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Planteles
                    </span>
                    </Link>

                    <Link
                    href="/dashboard/lesiones"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/medico.png"
                        alt="lesiones"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Lesiones
                    </span>
                    </Link>

                    

                    <Link
                    href="/dashboard/calendario"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition"
                    onClick={() => setMenuOpen(false)}
                    >
                    <img
                        src="/img/calendario.png"
                        alt="calendario"
                        className="w-5 h-5 object-contain"
                    />

                    <span>
                        Calendario
                    </span>
                    </Link>

                </div>
                )}
              </div>

              {/* PERFIL */}
              <div>

                <button
                  onClick={() =>
                    setPerfilOpen(
                      !perfilOpen
                    )
                  }
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3
                    rounded-2xl
                    bg-gray-50
                    hover:bg-gray-100
                    transition
                  "
                >
                  <span className="font-semibold text-sm">
                    Perfil
                  </span>

                  <span className="text-gray-400">
                    {perfilOpen
                      ? '−'
                      : '+'}
                  </span>
                </button>

                {perfilOpen && (
                  <div className="mt-2 space-y-1">

                    <Item
                      href="/dashboard/mis-datos"
                      label="Mis datos"
                      icon="🙍"
                    />

                    <Item
                      href="/dashboard/cambiar-password"
                      label="Contraseña"
                      icon="🔒"
                    />

                    <button
                      onClick={
                        handleLogout
                      }
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        rounded-2xl
                        hover:bg-red-50
                        transition
                        text-red-500
                      "
                    >
                      <span>
                        ↩
                      </span>

                      <span className="text-sm font-medium">
                        Cerrar sesión
                      </span>
                    </button>

                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="
                border-t
                border-gray-100
                p-4
                text-xs
                text-gray-400
              "
            >
              club.app © 2026
            </div>
          </div>
        </>
      )}
    </>
  )
}
