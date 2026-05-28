'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

const ROLES = [
  'JUGADOR',
  'MANAGER',
  'ENTRENADOR',
  'HC',
  'KINE',
  'PF',
  'NUTRICIONISTA',
  'ANALISTA',
  'MEDICO'
]

const POSICIONES = [
  'PILARDER',
  'HOOKER',
  'PILARIZQ',
  'SEGUNDA',
  'ALA',
  'OCTAVO',
  'MEDIOSCR',
  'APERTURA',
  'CENTRO',
  'WING',
  'FULLBACK'
]

export default function PersonasPage() {
  const [personas, setPersonas] = useState<any[]>([])
  const [planteles, setPlanteles] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  const [clienteUsuario, setClienteUsuario] =
    useState<number | null>(null)

    const inputClass = (value: string) => `
    border rounded-2xl p-3 text-sm
    transition-all
    focus:outline-none
    focus:ring-2 focus:ring-black/20
    hover:border-black
    ${!value ? 'text-gray-400' : 'text-black'}
  `
  // MODAL
  const [mostrarModal, setMostrarModal] =
    useState(false)

  // FILTRO
  const [filtro, setFiltro] = useState('')

  // FORM
  const [personaid, setPersonaid] =
    useState<number | null>(null)

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [mail, setMail] = useState('')
  const [rol, setRol] = useState('')
  const [posicion, setPosicion] = useState('')
  const [fechanacimiento, setFechanacimiento] =
    useState('')

  // ASOCIACIONES
  const [plantelesPersona, setPlantelesPersona] =
    useState<number[]>([])

  useEffect(() => {
    inicializar()
  }, [])

  // -------------------------
  // INIT
  // -------------------------
  const inicializar = async () => {
    setLoading(true)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('clienteid')
      .eq('id', user.id)
      .single()

    const clienteid = profile?.clienteid || null

    setClienteUsuario(clienteid)

    await Promise.all([
      cargarPersonas(clienteid),
      cargarPlanteles(clienteid)
    ])

    setLoading(false)
  }

  // -------------------------
  // LOADS
  // -------------------------
  const cargarPersonas = async (
    clienteid: number | null
  ) => {
    let query = supabase
      .from('persona')
      .select('*')
      .order('apellido')

    if (clienteid) {
      query = query.eq(
        'clienteid',
        clienteid
      )
    }

    const { data } = await query

    setPersonas(data ?? [])
  }

  const cargarPlanteles = async (
    clienteid: number | null
  ) => {
    let query = supabase
      .from('plantel')
      .select('*')
      .order('anio', {
        ascending: false
      })

    if (clienteid) {
      query = query.eq(
        'clienteid',
        clienteid
      )
    }

    const { data } = await query

    setPlanteles(data ?? [])
  }

  // -------------------------
  // MODAL
  // -------------------------
  const abrirNuevo = () => {
    limpiarFormulario()
    setMostrarModal(true)
  }

  const abrirEditar = async (p: any) => {
    setPersonaid(p.personaid)

    setNombre(p.nombre || '')
    setApellido(p.apellido || '')
    setDni(p.dni || '')
    setTelefono(p.telefono || '')
    setMail(p.mail || '')
    setRol(p.rol || '')
    setPosicion(p.posicion || '')
    setFechanacimiento(
      p.fechanacimiento || ''
    )

    const { data } = await supabase
      .from('plantel_persona')
      .select('plantelid')
      .eq('personaid', p.personaid)

    setPlantelesPersona(
      (data ?? []).map(
        (x) => x.plantelid
      )
    )

    setMostrarModal(true)
  }

  const cerrarModal = () => {
    limpiarFormulario()
    setMostrarModal(false)
  }

  // -------------------------
  // CRUD
  // -------------------------
  const guardarPersona = async () => {
    if (!nombre || !apellido || !dni) {
      alert(
        'Nombre, apellido y DNI son obligatorios'
      )
      return
    }

    const payload = {
      nombre,
      apellido,
      dni,
      telefono: telefono || null,
      mail: mail || null,
      rol: rol || 'JUGADOR',
      posicion: posicion || null,
      fechanacimiento:
        fechanacimiento || null,
      clienteid: clienteUsuario
    }

    let id = personaid

    if (personaid) {
      const { error } = await supabase
        .from('persona')
        .update(payload)
        .eq('personaid', personaid)

      if (error) {
        alert(error.message)
        return
      }

    } else {
      const { data, error } =
        await supabase
          .from('persona')
          .insert(payload)
          .select()
          .single()

      if (error) {
        alert(error.message)
        return
      }

      id = data.personaid
    }

    // relaciones plantel
    if (id) {
      await supabase
        .from('plantel_persona')
        .delete()
        .eq('personaid', id)

      if (plantelesPersona.length > 0) {
        const inserts =
          plantelesPersona.map(
            (plantelid) => ({
              personaid: id,
              plantelid
            })
          )

        await supabase
          .from('plantel_persona')
          .insert(inserts)
      }
    }

    cerrarModal()

    await cargarPersonas(clienteUsuario)
  }

  const borrarPersona = async (
    id: number
  ) => {
    const ok = confirm(
      '¿Eliminar persona?'
    )

    if (!ok) return

    await supabase
      .from('plantel_persona')
      .delete()
      .eq('personaid', id)

    const { error } = await supabase
      .from('persona')
      .delete()
      .eq('personaid', id)

    if (error) {
      alert(error.message)
      return
    }

    await cargarPersonas(clienteUsuario)
  }

  // -------------------------
  // HELPERS
  // -------------------------
  const limpiarFormulario = () => {
    setPersonaid(null)

    setNombre('')
    setApellido('')
    setDni('')
    setTelefono('')
    setMail('')
    setRol('')
    setPosicion('')
    setFechanacimiento('')

    setPlantelesPersona([])
  }

  const togglePlantel = (
    plantelid: number
  ) => {
    if (
      plantelesPersona.includes(plantelid)
    ) {
      setPlantelesPersona(
        plantelesPersona.filter(
          (x) => x !== plantelid
        )
      )
    } else {
      setPlantelesPersona([
        ...plantelesPersona,
        plantelid
      ])
    }
  }

  const formatearFecha = (
    fecha: string
  ) => {
    if (!fecha) return '-'

    return new Date(fecha)
      .toLocaleDateString('es-AR')
  }

  // -------------------------
  // FILTRO
  // -------------------------
  const personasFiltradas = useMemo(() => {
    return personas.filter((p) => {
      const txt =
        `
        ${p.nombre}
        ${p.apellido}
        ${p.mail}
        ${p.rol}
        ${p.posicion}
        ${p.dni}
        ${p.fechanacimiento}

      `
          .toLowerCase()

      return txt.includes(
        filtro.toLowerCase()
      )
    })
  }, [personas, filtro])

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-3 md:p-8 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="
        flex items-center justify-between
        mb-4 md:mb-6
      ">

        <h1 className="
          text-2xl md:text-3xl
          font-bold
        ">
          Personas
        </h1>

        <button
          onClick={abrirNuevo}
          className="
          bg-black text-white
          px-4 py-2 rounded-xl
          text-lg
          cursor-pointer
          hover:bg-gray-800
          hover:scale-[1.02]
          active:scale-95
          transition-all
        "
        >
          +
        </button>

      </div>

      {/* FILTRO */}
      <div className="mb-4 md:mb-6">

        <input
          placeholder="Buscar..."
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value)
          }
          className="
  w-full border
  rounded-xl p-3
  bg-white text-sm md:text-base
  transition-all
  focus:outline-none
  focus:ring-2 focus:ring-black/20
  hover:border-black
"
        />

      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3">

        {loading ? (
          <div className="bg-white rounded-2xl p-4 shadow">
            Cargando...
          </div>
        ) : (
          personasFiltradas.map((p) => (
            <div
              key={p.personaid}
              onClick={() =>
                abrirEditar(p)
              }
              className="
  bg-white rounded-2xl
  p-4 shadow
  space-y-2
  cursor-pointer
  hover:shadow-lg
  hover:-translate-y-0.5
  active:scale-[0.98]
  transition-all
"
            >

              <div className="
                flex items-start
                justify-between gap-2
              ">

                <div>

                  <div className="font-bold text-lg">
                    {p.apellido}, {p.nombre}
                  </div>

                  <div className="text-sm text-gray-500">
                    DNI: {p.dni}
                  </div>

                </div>

                <button
  onClick={(e) => {
    e.stopPropagation()

    borrarPersona(
      p.personaid
    )
  }}
  className="
    cursor-pointer
    hover:scale-110
    active:scale-90
    transition-all
  "
>
                  <img
                    src="/img/delete.png"
                    alt="delete"
                    className="w-6 h-6 pointer-events-none"
                  />
                </button>

              </div>

              <div className="
                grid grid-cols-2
                gap-2 text-sm
              ">

                <div>
                  <div className="text-gray-400">
                    Rol
                  </div>

                  <div>
                    {p.rol || '-'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">
                    Posición
                  </div>

                  <div>
                    {p.posicion || '-'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">
                    Nacimiento
                  </div>

                  <div>
                    {formatearFecha(
                      p.fechanacimiento
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">
                    Mail
                  </div>

                  <div className="truncate">
                    {p.mail || '-'}
                  </div>
                </div>

              </div>

            </div>
          ))
        )}

      </div>

      {/* DESKTOP TABLE */}
      <div className="
        hidden md:block
        bg-white rounded-2xl shadow
        overflow-auto
      ">

        {loading ? (
          <div className="p-6">
            Cargando...
          </div>
        ) : (
          <table className="w-full">

            <thead className="bg-gray-50 border-b">

              <tr>

                <th className="p-4 text-left">
                  Apellido
                </th>

                <th className="p-4 text-left">
                  Nombre
                </th>

                <th className="p-4 text-left">
                  Rol
                </th>

                <th className="p-4 text-left">
                  Posición
                </th>

                <th className="p-4 text-left">
                  Fecha nac.
                </th>

                <th className="p-4 text-left">
                  Mail
                </th>
              </tr>

            </thead>

            <tbody>

              {personasFiltradas.map((p) => (
                <tr
                  key={p.personaid}
                  onClick={() =>
                    abrirEditar(p)
                  }
                  className="
  border-b
  cursor-pointer
  hover:bg-gray-100
  hover:shadow-sm
  active:bg-gray-100
  transition-all
"
                >

                  <td className="p-4 font-semibold">
                    {p.apellido}
                  </td>

                  <td className="p-4">
                    {p.nombre}
                  </td>

                  <td className="p-4">
                    {p.rol || '-'}
                  </td>

                  <td className="p-4">
                    {p.posicion || '-'}
                  </td>

                  <td className="p-4">
                    {formatearFecha(
                      p.fechanacimiento
                    )}
                  </td>

                  <td className="p-4">
                    {p.mail || '-'}
                  </td>

                  <td className="p-4">

                  <button
  onClick={(e) => {
    e.stopPropagation()

    borrarPersona(
      p.personaid
    )
  }}
  className="
    cursor-pointer
    hover:scale-110
    active:scale-90
    transition-all
  "
>
                      <img
                        src="/img/delete.png"
                        alt="delete"
                        className="w-4 h-4 pointer-events-none"
                      />
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>

      {/* MODAL */}
        {mostrarModal && (
        <div
            className="
            fixed inset-0 z-50
            bg-black/60
            flex items-end md:items-center
            justify-center
            "
        >

        <div
className="
bg-white 
w-full h-[100dvh]
md:h-auto md:max-h-[90vh]
md:max-w-4xl
md:rounded-3xl
flex flex-col overflow-hidden

ml-auto
md:mx-auto

animate-slide-in
transition-all
"
        >

            {/* HEADER */}
            <div
                className="
                sticky top-0 z-10
                bg-white border-b
                px-4 py-4
                flex items-center justify-between
                "
            >

                <div>
                <div className="text-xl font-bold">
                    {personaid
                    ? 'Editar persona'
                    : 'Nueva persona'}
                </div>

                <div className="text-sm text-gray-500">
                    Datos personales y planteles
                </div>
                </div>

                <button
                onClick={cerrarModal}
                className="
                w-10 h-10
                rounded-full border
                flex items-center justify-center
                text-xl
                cursor-pointer
                hover:bg-gray-100
                hover:scale-110
                active:scale-90
                transition-all
              "
                >
                ×
                </button>

            </div>

            {/* BODY */}
            <div
                className="
                flex-1 overflow-y-auto pb-24
                p-4 space-y-5
                "
            >

                {/* DATOS */}
                <div>

                <div className="font-semibold mb-3">
                    Datos personales
                </div>

                <div
                    className="
                    grid grid-cols-1
                    sm:grid-cols-2
                    gap-3
                    "
                >

                    <input
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) =>
                        setNombre(e.target.value)
                    }
                    className={inputClass(nombre)}
                    />

                    <input
                    placeholder="Apellido"
                    value={apellido}
                    onChange={(e) =>
                        setApellido(e.target.value)
                    }
                    className={inputClass(apellido)}
                    />

                    <input
                    placeholder="DNI"
                    value={dni}
                    onChange={(e) =>
                        setDni(e.target.value)
                    }
                    className={inputClass(dni)}
                    />

                    <input
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) =>
                        setTelefono(e.target.value)
                    }
                    className={inputClass(telefono)}
                    />

                    <div className="relative">
                    <input
                        id="fechanacimiento"
                        type="date"
                        value={fechanacimiento}
                        onChange={(e) => setFechanacimiento(e.target.value)}
                        className="
                        peer border rounded-2xl p-3 pt-5
                        w-full text-sm
                        transition-all
                        focus:outline-none
                        focus:ring-2 focus:ring-black/20
                        hover:border-black
                        "
                    />

                    <label
                        htmlFor="fechanacimiento"
                        className="
                        absolute left-3 top-3 text-gray-400 text-sm
                        transition-all
                        peer-focus:text-xs peer-focus:-top-1
                        peer-valid:text-xs peer-valid:-top-1
                        bg-white px-1
                        "
                    >
                        Fecha de nacimiento
                    </label>
                    </div>

                    

                    <select
                    value={posicion}
                    onChange={(e) =>
                        setPosicion(e.target.value)
                    }
                    className={inputClass(posicion)}
                    >
                    <option value="">
                        Posición
                    </option>

                    {POSICIONES.map((p) => (
                        <option
                        key={p}
                        value={p}
                        >
                        {p}
                        </option>
                    ))}
                    </select>

                </div>

                </div>

                {/* PLANTELES */}
                <div>

                <div className="font-semibold mb-3">
                    Planteles asociados
                </div>

                <div
                    className="
                    grid grid-cols-2
                    sm:grid-cols-3
                    md:grid-cols-4
                    gap-2
                    "
                >

                    {planteles.map((p) => {
                    const activo =
                        plantelesPersona.includes(
                        p.plantelid
                        )

                    return (
                        <button
                        key={p.plantelid}
                        type="button"
                        onClick={() =>
                            togglePlantel(
                            p.plantelid
                            )
                        }
                        className={`
                            rounded-2xl border
                            p-3 text-left
                            transition-all
                            min-h-[72px]
                            cursor-pointer
                            hover:scale-[1.02]
                            active:scale-95
                            ${
                                activo
                                ? 'bg-green-700 text-white border-green-700'
                                : 'bg-white hover:bg-gray-50'
                            }
                            `}
                        >

                        <div className="font-semibold text-sm leading-tight">
                            {p.categoria}
                        </div>

                        <div
                            className={`
                            text-xs mt-1
                            ${
                                activo
                                ? 'text-gray-300'
                                : 'text-gray-500'
                            }
                            `}
                        >
                            {p.anio}
                        </div>

                        </button>
                    )
                    })}

                </div>

                </div>

            </div>

            {/* FOOTER */}
            <div className="
  sticky bottom-0 
  bg-white border-t p-4 
  flex gap-2
  z-20
">

                <button
                onClick={guardarPersona}
                className="
  flex-1
  bg-black text-white
  py-3 rounded-2xl
  font-medium
  cursor-pointer
  hover:bg-gray-800
  hover:scale-[1.02]
  active:scale-95
  transition-all
"
                >
                Guardar
                </button>

                <button
                onClick={cerrarModal}
                className="
                    flex-1 border
                    py-3 rounded-2xl
                    font-medium
                    cursor-pointer
                    hover:bg-gray-200
                    hover:scale-[1.02]
                    active:scale-95
                    transition-all
                "
                >
                Cancelar
                </button>

            </div>

            </div>

        </div>
        )}

    </div>
  )
}