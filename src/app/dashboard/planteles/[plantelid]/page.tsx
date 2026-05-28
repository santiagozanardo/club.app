'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function PlantelPersonasPage() {
  const { plantelid } = useParams()

  const plantelidNumber = Number(plantelid)

  const [plantel, setPlantel] =
    useState<any | null>(null)

  const [personasPlantel, setPersonasPlantel] =
    useState<any[]>([])

  const [personasDisponibles, setPersonasDisponibles] =
    useState<any[]>([])

  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<number | null>(null)

  // FILTROS
  const [filtroNombre, setFiltroNombre] =
    useState('')

  const [filtroApellido, setFiltroApellido] =
    useState('')

  const [filtroRol, setFiltroRol] =
    useState('')

  const [filtroPosicion, setFiltroPosicion] =
    useState('')

    const [filtroFechaNacimiento, setFiltroFechaNacimiento] =
  useState('')

  // MODAL
  const [mostrarModal, setMostrarModal] =
    useState(false)

  const [personaEditando, setPersonaEditando] =
    useState<any | null>(null)

  // FORM
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [mail, setMail] = useState('')
  const [rol, setRol] = useState('')
  const [posicion, setPosicion] = useState('')
  const [fechanacimiento, setFechanacimiento] =
    useState('')

  // -------------------------
  // LOAD
  // -------------------------
  const cargarPlantel = async () => {
    const { data } = await supabase
      .from('plantel')
      .select('categoria, anio')
      .eq('plantelid', plantelidNumber)
      .single()

    setPlantel(data)
  }

  const cargarPersonasPlantel = async () => {
    const { data } = await supabase
      .from('plantel_persona')
      .select(`
        plantel_personaid,
        personaid,
        persona:personaid (
          personaid,
          nombre,
          apellido,
          dni,
          telefono,
          mail,
          rol,
          posicion,
          fechanacimiento
        )
      `)
      .eq('plantelid', plantelidNumber)

    setPersonasPlantel(data ?? [])
  }

  const cargarDisponibles = async () => {
    const { data } = await supabase
      .from('persona')
      .select(`
        personaid,
        nombre,
        apellido
      `)
      .order('apellido')

    setPersonasDisponibles(data ?? [])
  }

  // -------------------------
  // AGREGAR
  // -------------------------
  const agregarPersona = async () => {
    if (!personaSeleccionada) return

    await supabase
      .from('plantel_persona')
      .insert({
        plantelid: plantelidNumber,
        personaid: personaSeleccionada
      })

    setPersonaSeleccionada(null)

    cargarPersonasPlantel()
  }

  // -------------------------
  // ELIMINAR
  // -------------------------
  const eliminarPersona = async (
    id: number
  ) => {
    const ok = confirm(
      '¿Eliminar persona del plantel?'
    )

    if (!ok) return

    await supabase
      .from('plantel_persona')
      .delete()
      .eq('plantel_personaid', id)

    cargarPersonasPlantel()
  }

  // -------------------------
  // MODAL
  // -------------------------
  const abrirModal = (persona: any) => {
    setPersonaEditando(persona)

    setNombre(persona.nombre || '')
    setApellido(persona.apellido || '')

    setDni(
      persona.dni
        ? String(persona.dni)
        : ''
    )

    setTelefono(persona.telefono || '')
    setMail(persona.mail || '')

    setRol(persona.rol || '')
    setPosicion(persona.posicion || '')

    setFechanacimiento(
      persona.fechanacimiento || ''
    )

    setMostrarModal(true)
  }

  const guardarPersona = async () => {
    if (!nombre || !apellido || !dni) {
      alert(
        'Nombre, apellido y DNI son obligatorios'
      )
      return
    }

    const data = {
      nombre,
      apellido,

      dni:
        dni === ''
          ? null
          : Number(dni),

      telefono:
        telefono === ''
          ? null
          : telefono,

      mail:
        mail === ''
          ? null
          : mail,

      rol:
        rol === ''
          ? null
          : rol,

      posicion:
        posicion === ''
          ? null
          : posicion,

      fechanacimiento:
        fechanacimiento === ''
          ? null
          : fechanacimiento
    }

    const { error } = await supabase
      .from('persona')
      .update(data)
      .eq(
        'personaid',
        personaEditando.personaid
      )

    if (error) {
      alert(error.message)
      return
    }

    setMostrarModal(false)

    cargarPersonasPlantel()
  }

  // -------------------------
  // FILTRO
  // -------------------------
  const personasFiltradas = useMemo(() => {
    return personasPlantel.filter((p) => {
      const nombre =
        p.persona?.nombre
          ?.toLowerCase() || ''

      const apellido =
        p.persona?.apellido
          ?.toLowerCase() || ''

      const rol =
        p.persona?.rol
          ?.toLowerCase() || ''

      const posicion =
        p.persona?.posicion
          ?.toLowerCase() || ''
    
        const fechaNacimiento =
        p.persona?.fechanacimiento || ''

        const fechaNacimientoFormateada =
  p.persona?.fechanacimiento
    ? new Date(
        p.persona.fechanacimiento + 'T00:00:00'
      ).toLocaleDateString('es-AR')
    : ''

      return (
        nombre.includes(
          filtroNombre.toLowerCase()
        ) &&
        apellido.includes(
          filtroApellido.toLowerCase()
        ) &&
        rol.includes(
          filtroRol.toLowerCase()
        ) &&
        posicion.includes(
          filtroPosicion.toLowerCase()
        ) &&
        fechaNacimientoFormateada
        .toLowerCase()
        .includes(
            filtroFechaNacimiento.toLowerCase()
        )
      )
    })
  }, [
    personasPlantel,
    filtroNombre,
    filtroApellido,
    filtroRol,
    filtroPosicion,
    filtroFechaNacimiento
  ])

  // -------------------------
  // INIT
  // -------------------------
  useEffect(() => {
    if (plantelid) {
      cargarPlantel()
      cargarPersonasPlantel()
      cargarDisponibles()
    }
  }, [plantelid])

  return (
    <div className="
      p-3 md:p-8
      bg-gray-100 min-h-screen
    ">

      {/* HEADER */}
      <div className="mb-4 md:mb-6">

        <h1 className="
          text-2xl md:text-3xl
          font-bold
        ">
          {plantel
            ? `${plantel.categoria} - ${plantel.anio}`
            : 'Cargando...'}
        </h1>

      </div>

    

      {/* FILTROS */}
      <div className="
        grid grid-cols-1 md:grid-cols-4
        gap-2 md:gap-3
        mb-4 md:mb-6
      ">

        <input
          placeholder="Nombre"
          className="
            border p-3 rounded-xl
            text-sm
focus:ring-2 focus:ring-black/20
transition-all
          "
          value={filtroNombre}
          onChange={(e) =>
            setFiltroNombre(
              e.target.value
            )
          }
        />

        <input
          placeholder="Apellido"
          className="
            border p-3 rounded-xl
            text-sm
focus:ring-2 focus:ring-black/20
transition-all
          "
          value={filtroApellido}
          onChange={(e) =>
            setFiltroApellido(
              e.target.value
            )
          }
        />

            <input
            placeholder="Fecha de nacimiento"
            className="
                border p-3 rounded-xl
                text-sm
focus:ring-2 focus:ring-black/20
transition-all
            "
            value={filtroFechaNacimiento}
            onChange={(e) =>
                setFiltroFechaNacimiento(
                e.target.value
                )
            }
            />


        <select
          className="
          border p-3 rounded-xl
          text-sm
focus:ring-2 focus:ring-black/20
transition-all
          "
          value={filtroPosicion}
          onChange={(e) =>
            setFiltroPosicion(
              e.target.value
            )
          }
        >
          <option value="">
            Todas las posiciones
          </option>

          {POSICIONES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}

        </select>

      </div>

      {/* MOBILE CARDS */}
      <div className="
        md:hidden
        space-y-3
      ">

        {personasFiltradas.map((p) => (
          <div
            key={p.plantel_personaid}
            onClick={() =>
              abrirModal(p.persona)
            }
            className="
  bg-white rounded-2xl
  p-4 shadow
  space-y-2
  cursor-pointer
  hover:shadow-md
  hover:scale-[1.01]
  active:scale-[0.99]
  transition-all
"
          >

            <div className="
              flex items-start
              justify-between gap-3
            ">

              <div>

                <div className="
                  font-bold text-base
                ">
                  {p.persona?.apellido},{' '}
                  {p.persona?.nombre}
                </div>

                <div className="text-sm text-gray-500">
                {p.persona?.fechanacimiento
                    ? new Date(
                        p.persona.fechanacimiento + 'T00:00:00'
                    ).toLocaleDateString('es-AR')
                    : ''}
                </div>

              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()

                  eliminarPersona(
                    p.plantel_personaid
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
                  className="w-6 h-6"
                />
              </button>

            </div>

            <div className="
              flex gap-2 flex-wrap
            ">


              {p.persona?.posicion && (
                <div className="
                  px-2 py-1 rounded-lg
                  bg-gray-100 text-xs
                ">
                  {p.persona.posicion}
                </div>
              )}

            </div>

          </div>
        ))}

      </div>

      {/* DESKTOP TABLE */}
      <div className="
        hidden md:block
        bg-white rounded-2xl
        shadow overflow-hidden
      ">

        <table className="w-full">

          <thead className="
            bg-gray-50 border-b
          ">

            <tr>

              <th className="p-4 text-left">
                Nombre
              </th>

              <th className="p-4 text-left">
                Apellido
              </th>

              <th className="p-4 text-left">
                DNI
              </th>

              <th className="p-4 text-left">
                Fecha de nacimiento
              </th>

              <th className="p-4 text-left">
                Posición
              </th>


            </tr>

          </thead>

          <tbody>

            {personasFiltradas.map((p) => (
              <tr
                key={p.plantel_personaid}
                className="
  border-b hover:bg-gray-50
  cursor-pointer
  transition-all
  active:scale-[0.998]
"
                onClick={() =>
                  abrirModal(p.persona)
                }
              >

                <td className="p-4">
                  {p.persona?.nombre}
                </td>

                <td className="p-4">
                  {p.persona?.apellido}
                </td>

                <td className="p-4">
                  {p.persona?.dni}
                </td>

                <td className="p-4">
                {p.persona?.fechanacimiento
                    ? new Date(
                        p.persona.fechanacimiento + 'T00:00:00'
                    ).toLocaleDateString('es-AR')
                    : ''}
                </td>

                <td className="p-4">
                  {p.persona?.posicion}
                </td>

                <td className="p-4">

                  <button
                    onClick={(e) => {
                      e.stopPropagation()

                      eliminarPersona(
                        p.plantel_personaid
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
                      className="w-5 h-5"
                    />
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="
          fixed inset-0 z-50
          bg-black/50
          flex items-end md:items-center
          justify-center
        ">

          <div className="
            bg-white w-full
            md:max-w-xl
            rounded-t-3xl md:rounded-2xl
            p-4 md:p-6
            space-y-4
            max-h-[95vh]
            overflow-y-auto
          ">

            <h2 className="
              text-xl md:text-2xl
              font-bold
            ">
              Editar persona
            </h2>

            <div className="
              grid grid-cols-1 md:grid-cols-2
              gap-3
            ">

              <input
                placeholder="Nombre *"
                className="
                  border p-3 rounded-xl
focus:ring-2 focus:ring-black/20
transition-all
                "
                value={nombre}
                onChange={(e) =>
                  setNombre(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Apellido *"
                className="
                  border p-3 rounded-xl
focus:ring-2 focus:ring-black/20
transition-all
                "
                value={apellido}
                onChange={(e) =>
                  setApellido(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="DNI *"
                className="
                  border p-3 rounded-xl
focus:ring-2 focus:ring-black/20
transition-all
                "
                value={dni}
                onChange={(e) =>
                  setDni(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Teléfono"
                className="
                  border p-3 rounded-xl
focus:ring-2 focus:ring-black/20
transition-all
                "
                value={telefono}
                onChange={(e) =>
                  setTelefono(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Mail"
                className="
                  border p-3 rounded-xl
                  md:col-span-2
focus:ring-2 focus:ring-black/20
transition-all
                "
                value={mail}
                onChange={(e) =>
                  setMail(
                    e.target.value
                  )
                }
              />

              <select
                className="
                  border p-3 rounded-xl
                  bg-white
                "
                value={rol}
                onChange={(e) =>
                  setRol(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar rol
                </option>

                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}

              </select>

              <select
                className="
                  border p-3 rounded-xl
                  bg-white
                "
                value={posicion}
                onChange={(e) =>
                  setPosicion(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar posición
                </option>

                {POSICIONES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}

              </select>

              <input
                type="date"
                className="
                  border p-3 rounded-xl
focus:ring-2 focus:ring-black/20
transition-all
                "
                value={fechanacimiento}
                onChange={(e) =>
                  setFechanacimiento(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="
              flex flex-col md:flex-row
              gap-2 pt-2
            ">

              <button
                onClick={guardarPersona}
                className="
  flex-1 bg-black
  text-white py-3
  rounded-xl
  cursor-pointer
  hover:opacity-90
  active:scale-[0.98]
  transition-all
"
              >
                Guardar
              </button>

              <button
                onClick={() =>
                  setMostrarModal(false)
                }
                className="
  flex-1 border
  py-3 rounded-xl
  cursor-pointer
  hover:bg-gray-50
  active:scale-[0.98]
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