'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<any[]>([])
  const [planteles, setPlanteles] = useState<any[]>([])

  const [clienteId, setClienteId] =
    useState<number | null>(null)

  const router = useRouter()

  // MODAL
  const [mostrarModal, setMostrarModal] =
    useState(false)

  const [editandoId, setEditandoId] =
    useState<number | null>(null)

  // FORM SESION
  const [fecha, setFecha] = useState('')
  const [tipo, setTipo] =
    useState('ENTRENAMIENTO')

  const [hora, setHora] = useState('')

  const [plantelId, setPlantelId] =
    useState<number | null>(null)

  // FILTROS
  const [filtroFecha, setFiltroFecha] =
    useState('')

  const [filtroTipo, setFiltroTipo] =
    useState('')

  const [filtroPlantel, setFiltroPlantel] =
    useState('')

  // PAGINACIÓN
  const [paginaSesiones, setPaginaSesiones] =
    useState(1)

  const pageSize = 10

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } =
      await supabase
        .from('profiles')
        .select('clienteid')
        .eq('id', user.id)
        .single()

    setClienteId(profile?.clienteid || null)

    cargarSesiones(profile?.clienteid)
    cargarPlanteles(profile?.clienteid)
  }

  // -------------------------
  // DATA
  // -------------------------
  const cargarSesiones = async (
    clienteid: number | null
  ) => {
    let query = supabase
      .from('sesion')
      .select('*')
      .eq('tipo', 'ENTRENAMIENTO')
      .order('fecha', {
        ascending: false
      })

    if (clienteid) {
      query = query.eq(
        'clienteid',
        clienteid
      )
    }

    const { data } = await query

    setSesiones(data ?? [])
  }

  const cargarPlanteles = async (
    clienteid: number | null
  ) => {
    let query = supabase
      .from('plantel')
      .select(
        'plantelid, categoria, anio'
      )

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
  // CREAR / EDITAR
  // -------------------------
  const guardarSesion = async () => {
    if (
      !fecha ||
      !hora ||
      !tipo ||
      !plantelId
    )
      return

    if (editandoId) {
      await supabase
        .from('sesion')
        .update({
          fecha,
          hora,
          tipo: 'ENTRENAMIENTO',
          plantelid: plantelId
        })
        .eq('sesionid', editandoId)
    } else {
      const { data: sesionData } =
        await supabase
          .from('sesion')
          .insert({
            fecha,
            hora,
            tipo: 'ENTRENAMIENTO',
            plantelid: plantelId,
            clienteid: clienteId
          })
          .select()
          .single()

      const { data: personas } =
        await supabase
          .from('plantel_persona')
          .select('personaid')
          .eq('plantelid', plantelId)

      if (personas?.length) {
        await supabase
          .from('sesion_asistencia')
          .insert(
            personas.map((p) => ({
              sesionid:
                sesionData.sesionid,
              personaid: p.personaid,
              asistencia: false
            }))
          )
      }
    }

    limpiarModal()
    cargarSesiones(clienteId)
  }

  const editarSesion = (s: any) => {
    setEditandoId(s.sesionid)
    setFecha(s.fecha)
    setHora(s.hora || '')
    setTipo(s.tipo)
    setPlantelId(s.plantelid)
    setMostrarModal(true)
  }

  const eliminarSesion = async (
    id: number
  ) => {
    const ok = confirm(
      '¿Eliminar sesión?'
    )

    if (!ok) return

    await supabase
      .from('sesion_asistencia')
      .delete()
      .eq('sesionid', id)

    await supabase
      .from('sesion')
      .delete()
      .eq('sesionid', id)

    cargarSesiones(clienteId)
  }

  const limpiarModal = () => {
    setMostrarModal(false)
    setEditandoId(null)
    setFecha('')
    setHora('')
    setTipo('ENTRENAMIENTO')
    setPlantelId(null)
  }

  // -------------------------
  // FILTROS
  // -------------------------
  const sesionesFiltradas =
    useMemo(() => {
      return sesiones.filter((s) => {
        const plantel =
          planteles.find(
            (p) =>
              p.plantelid ===
              s.plantelid
          )

        const textoPlantel =
          `${
            plantel?.categoria || ''
          } ${
            plantel?.anio || ''
          }`.toLowerCase()

        const matchFecha =
          s.fecha
            ?.toLowerCase()
            .includes(
              filtroFecha.toLowerCase()
            )

        const matchTipo =
          s.tipo
            ?.toLowerCase()
            .includes(
              filtroTipo.toLowerCase()
            )

        const matchPlantel =
          textoPlantel.includes(
            filtroPlantel.toLowerCase()
          )

        return (
          matchFecha &&
          matchTipo &&
          matchPlantel
        )
      })
    }, [
      sesiones,
      planteles,
      filtroFecha,
      filtroTipo,
      filtroPlantel
    ])

  const sesionesPaginadas =
    useMemo(() => {
      const start =
        (paginaSesiones - 1) *
        pageSize

      return sesionesFiltradas.slice(
        start,
        start + pageSize
      )
    }, [
      sesionesFiltradas,
      paginaSesiones
    ])

  const totalPaginas = Math.ceil(
    sesionesFiltradas.length /
      pageSize
  )

  return (
    <div className="p-4 md:p-8 w-full max-w-full overflow-x-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 gap-3 min-w-0">

  <h1
    className="
      text-2xl md:text-3xl
      font-bold
      truncate
      min-w-0
      flex-1
    "
  >
    Entrenamientos
  </h1>

  <button
    className="
    bg-black text-white
    px-4 py-2 rounded-xl
    cursor-pointer
    hover:opacity-90
    hover:scale-[1.03]
    active:scale-95
    transition-all
  "
    onClick={() =>
      setMostrarModal(true)
    }
  >
    +
  </button>

</div>

      {/* FILTROS */}
      <div
        className="
          bg-white
          rounded-2xl
          shadow
          p-4
          mb-6
          grid
          grid-cols-1
          md:grid-cols-3
          gap-3
        "
      >

        <input
          className="border p-3 rounded-xl text-sm w-full min-w-0"
          placeholder="Fecha"
          value={filtroFecha}
          onChange={(e) =>
            setFiltroFecha(
              e.target.value
            )
          }
        />

        <input
          className="border p-3 rounded-xl text-sm w-full min-w-0"
          placeholder="Plantel"
          value={filtroPlantel}
          onChange={(e) =>
            setFiltroPlantel(
              e.target.value
            )
          }
        />

      </div>

      {/* LISTADO */}
      <div className="space-y-4">

        {sesionesPaginadas.map((s) => {
          const plantel =
            planteles.find(
              (p) =>
                p.plantelid ===
                s.plantelid
            )

          return (
            <div
              key={s.sesionid}
              onClick={() =>
                router.push(
                  `/dashboard/sesiones/${s.sesionid}`
                )
              }
              className="
                bg-white
                rounded-2xl
                shadow
                p-4
                md:p-5
                flex
                items-start
                justify-between
                gap-3
                cursor-pointer
                hover:bg-gray-50
                transition
              "
            >

              <div className="flex flex-col items-start justify-center min-w-0">

                <div className="font-semibold text-base md:text-lg">
                  {new Date(
                    s.fecha +
                      'T00:00:00'
                  ).toLocaleDateString(
                    'es-AR'
                  )}
                </div>

                <div className="text-xs md:text-sm text-gray-600 font-medium">
                {s.hora
                ? s.hora.slice(0, 5)
                : '--:--'}
                </div>

                <div className="text-xs md:text-sm text-gray-500">
                  {plantel
                    ? `${plantel.categoria} - ${plantel.anio}`
                    : 'Sin plantel'}
                </div>

              </div>

              <div className="flex gap-2 shrink-0">

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    eliminarSesion(
                      s.sesionid
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
                    alt="eliminar"
                    className="w-5 h-5"
                  />
                </button>

              </div>

            </div>
          )
        })}

      </div>

      {/* PAGINACIÓN */}
      <div
        className="
          flex
          items-center
          justify-center
          gap-2
          mt-6
          flex-wrap
        "
      >

        <button
          className="
            border
            px-3
            py-2
            rounded-xl
            disabled:opacity-30
            text-sm
          "
          disabled={
            paginaSesiones === 1
          }
          onClick={() =>
            setPaginaSesiones(
              paginaSesiones - 1
            )
          }
        >
          Anterior
        </button>

        <div className="px-3 py-1 text-sm">
          {paginaSesiones} /{' '}
          {totalPaginas || 1}
        </div>

        <button
          className="
            border
            px-3
            py-2
            rounded-xl
            disabled:opacity-30
            text-sm
          "
          disabled={
            paginaSesiones >=
            totalPaginas
          }
          onClick={() =>
            setPaginaSesiones(
              paginaSesiones + 1
            )
          }
        >
          Siguiente
        </button>

      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div
            className="
              bg-white
              p-5
              rounded-2xl
              w-[95%]
              max-w-md
              space-y-4
            "
          >

            <input
              className="border p-3 w-full rounded-xl"
              type="date"
              value={fecha}
              onChange={(e) =>
                setFecha(
                  e.target.value
                )
              }
            />

            <input
              className="border p-3 w-full rounded-xl"
              type="time"
              value={hora}
              onChange={(e) =>
                setHora(
                  e.target.value
                )
              }
            />

            <select
              className="border p-3 w-full rounded-xl"
              value={
                plantelId || ''
              }
              onChange={(e) =>
                setPlantelId(
                  Number(
                    e.target.value
                  )
                )
              }
            >

              <option value="">
                Plantel
              </option>

              {planteles.map((p) => (
                <option
                  key={p.plantelid}
                  value={p.plantelid}
                >
                  {p.categoria} -{' '}
                  {p.anio}
                </option>
              ))}

            </select>

            <div className="flex gap-2 pt-2">

              <button
                className="
                flex-1 bg-black text-white
                py-3 rounded-xl
                cursor-pointer
                hover:opacity-90
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all
              "
                onClick={
                  guardarSesion
                }
              >
                {editandoId
                  ? 'Actualizar'
                  : 'Crear'}
              </button>

              <button
                className="
                flex-1 border
                py-3 rounded-xl
                cursor-pointer
                hover:bg-gray-50
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all
              "
                onClick={
                  limpiarModal
                }
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