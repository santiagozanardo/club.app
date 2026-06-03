'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

export default function SesionDetallePage() {
  const { sesionid } = useParams()

  const [sesion, setSesion] = useState<any | null>(null)
  const [asistencias, setAsistencias] = useState<any[]>([])

  const [filtroPersona, setFiltroPersona] = useState('')
  const [filtroAsistencia, setFiltroAsistencia] = useState('')

  const [pagina, setPagina] = useState(1)

  const pageSize = 10

  useEffect(() => {
    if (sesionid) {
      cargarSesion()
      cargarAsistencias()
    }
  }, [sesionid])

  // -----------------------------------
  // LOADS
  // -----------------------------------
  const cargarSesion = async () => {
    const { data } = await supabase
      .from('sesion')
      .select(`
        sesionid,
        plantelid,
        fecha,
        tipo,
        plantel:plantelid (
          categoria,
          anio
        )
      `)
      .eq('sesionid', sesionid)
      .single()

    setSesion(data)
  }

  const cargarAsistencias = async () => {
    const { data } = await supabase
  .from('sesion_asistencia')
  .select(`
    sesion_asistenciaid,
    asistencia,
    personaid,
    persona:personaid (
      nombre,
      apellido,
      lesion (
        lesionid,
        estado
      )
    )
  `)
  .eq('sesionid', sesionid)

    setAsistencias(data ?? [])
  }

  // -----------------------------------
  // REFRESH DESDE PLANTEL
  // -----------------------------------
  const actualizarDesdePlantel = async () => {

    if (!sesion?.plantelid) return

    const sesionIdNumber = Number(sesionid)

    // jugadores del plantel
    const { data: plantel } = await supabase
      .from('plantel_persona')
      .select('personaid')
      .eq('plantelid', sesion.plantelid)

    const plantelIds =
      (plantel ?? []).map(p => Number(p.personaid))

    // asistencias actuales
    const { data: asistencia } = await supabase
      .from('sesion_asistencia')
      .select(`
        sesion_asistenciaid,
        personaid
      `)
      .eq('sesionid', sesionIdNumber)

    const asistenciaArr = asistencia ?? []

    const asistenciaIds =
      asistenciaArr.map(a => Number(a.personaid))

    // insertar faltantes
    const nuevos = plantelIds
      .filter(id => !asistenciaIds.includes(id))
      .map(id => ({
        sesionid: sesionIdNumber,
        personaid: Number(id),
        asistencia: false
      }))

    if (nuevos.length) {

      const { error } = await supabase
        .from('sesion_asistencia')
        .insert(nuevos)

      console.log(error)
    }

    // eliminar jugadores que ya no están
    const aEliminar = asistenciaArr.filter(
      a => !plantelIds.includes(Number(a.personaid))
    )

    if (aEliminar.length) {

      const { error } = await supabase
        .from('sesion_asistencia')
        .delete()
        .in(
          'sesion_asistenciaid',
          aEliminar.map(
            a => a.sesion_asistenciaid
          )
        )

      console.log(error)
    }

    await cargarAsistencias()
  }

  // -----------------------------------
  // TOGGLE
  // -----------------------------------
  const toggleAsistencia = async (
    id: number,
    value: boolean
  ) => {

    setAsistencias(prev =>
      prev.map(a =>
        a.sesion_asistenciaid === id
          ? {
              ...a,
              asistencia: !value
            }
          : a
      )
    )

    await supabase
      .from('sesion_asistencia')
      .update({
        asistencia: !value
      })
      .eq('sesion_asistenciaid', id)
  }

  // -----------------------------------
  // FILTROS
  // -----------------------------------
  const asistenciasFiltradas = useMemo(() => {
    return asistencias
      .filter((a) => {

        const matchPersona =
          `${a.persona?.nombre} ${a.persona?.apellido}`
            .toLowerCase()
            .includes(
              filtroPersona.toLowerCase()
            )

        const matchAsistencia =
          filtroAsistencia === ''
            ? true
            : filtroAsistencia === 'PRESENTE'
            ? a.asistencia === true
            : a.asistencia === false

        return (
          matchPersona &&
          matchAsistencia
        )
      })
      .sort((a, b) => {

        const apellidoA =
          a.persona?.apellido || ''

        const apellidoB =
          b.persona?.apellido || ''

        const nombreA =
          a.persona?.nombre || ''

        const nombreB =
          b.persona?.nombre || ''

        const comparacionApellido =
          apellidoA.localeCompare(
            apellidoB
          )

        if (comparacionApellido !== 0) {
          return comparacionApellido
        }

        return nombreA.localeCompare(
          nombreB
        )
      })
  }, [
    asistencias,
    filtroPersona,
    filtroAsistencia
  ])

  const presentes = asistencias.filter(a => a.asistencia).length

  // -----------------------------------
  // PAGINACION
  // -----------------------------------
  const asistenciasPaginadas = useMemo(() => {

    const start =
      (pagina - 1) * pageSize

    return asistenciasFiltradas.slice(
      start,
      start + pageSize
    )

  }, [
    asistenciasFiltradas,
    pagina
  ])

  const totalPaginas = Math.ceil(
    asistenciasFiltradas.length / pageSize
  )

  // -----------------------------------
  // UI
  // -----------------------------------
  return (
    <div className="p-3 md:p-8 overflow-x-hidden">

      <h1 className="text-3xl font-bold mb-2">
        {sesion?.plantel?.categoria}
        {' - '}
        {sesion?.plantel?.anio}
      </h1>

      <div className="text-gray-500 mb-6">
        {sesion?.tipo}
        {' · '}
        {sesion?.fecha}
      </div>
        <div className="mb-4">
            <span className="
                inline-flex
                items-center
                bg-green-100
                text-green-700
                px-3 py-1
                rounded-full
                text-sm
                font-semibold
                shadow-sm
            ">
                Presentes: {presentes}
            </span>
            </div>


      <div className="bg-white rounded-2xl shadow overflow-x-auto">

        {/* FILTROS */}
        <div
  className="
    p-4
    flex
    flex-col
    md:grid
    md:grid-cols-[auto_1fr_1fr]
    gap-2
    border-b
    items-stretch
    w-full
    min-w-0
  "
>

          <button
            type="button"
            title="Actualizar jugadores del plantel"
            onClick={actualizarDesdePlantel}
            className="
              flex items-center justify-center
              w-10 h-10
              rounded-xl
              hover:bg-gray-100
              active:scale-90
              active:translate-y-[1px]
              transition-all duration-150
              cursor-pointer
              shadow-sm hover:shadow
            "
          >
            <img
              src="/img/refresh.png"
              alt="refresh"
              className="
                w-7 h-7
                pointer-events-none
                transition-transform duration-200
                hover:rotate-180
              "
            />
          </button>

          <input
            className="border p-2 rounded w-full min-w-0"
            placeholder="Persona"
            value={filtroPersona}
            onChange={(e) => {
              setFiltroPersona(e.target.value)
              setPagina(1)
            }}
          />

          <select
            className="border p-2 rounded w-full min-w-0"
            value={filtroAsistencia}
            onChange={(e) => {
              setFiltroAsistencia(e.target.value)
              setPagina(1)
            }}
          >
            <option value="">
              Todas las asistencias
            </option>

            <option value="PRESENTE">
              Presentes
            </option>

            <option value="AUSENTE">
              Ausentes
            </option>
          </select>

        </div>

        {/* TABLA */}

        <table className="w-full min-w-[320px]">

          <thead className="bg-gray-50">
            <tr>

              <th className="p-4 text-left">
                Persona
              </th>

              <th className="p-4 text-left">
                Asistencia
              </th>

            </tr>
          </thead>

          <tbody>

          {asistenciasPaginadas.map((a) => {

          const lesionado =
            a.persona?.lesion?.some(
              (l: any) =>
                l.estado === 'ACTIVA'
            ) ?? false

          return (

              <tr
                key={a.sesion_asistenciaid}
                className="border-b"
              >

              <td className="p-4">

              <div className="flex items-center gap-2">

                <span>
                  {a.persona?.apellido},
                  {' '}
                  {a.persona?.nombre}
                </span>

                {lesionado && (
                  <img
                    src="/img/cruz_roja.png"
                    className="w-5 h-5"
                    title="Jugador lesionado"
                  />
                )}

              </div>

              </td>

                <td className="p-4">

                    <button
                        onClick={() =>
                        toggleAsistencia(
                            a.sesion_asistenciaid,
                            a.asistencia
                        )
                        }
                        className={`
                        group
                        relative
                        w-10 h-10
                        rounded-full
                        flex items-center justify-center
                        transition-all duration-300
                        cursor-pointer
                        border
                        active:scale-90
                        hover:scale-105
                        ${
                            a.asistencia
                            ? `
                                bg-green-500
                                border-green-500
                                shadow-md shadow-green-200
                            `
                            : `
                                bg-gray-100
                                border-gray-300
                                hover:bg-gray-200
                            `
                        }
                        `}
                    >

                        {/* glow suave */}
                        <div
                        className={`
                            absolute inset-0
                            rounded-full
                            transition-all duration-300
                            ${
                            a.asistencia
                                ? 'animate-pulse bg-green-400/20'
                                : ''
                            }
                        `}
                        />

                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`
                            relative
                            w-5 h-5
                            transition-all duration-300
                            ${
                            a.asistencia
                                ? 'text-white scale-100 rotate-0'
                                : 'text-gray-400 scale-75 rotate-[-10deg]'
                            }
                        `}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                        >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                        </svg>

                    </button>

                    </td>

              </tr>

            )})}

          </tbody>

        </table>

        {/* PAGINACION */}
        <div
            className="
                flex flex-col md:flex-row
                gap-3
                md:justify-between
                md:items-center
                p-4
                border-t
                bg-white
            "
            >

          <button
            className="
              px-4 py-2 border rounded
              disabled:opacity-50
            "
            disabled={pagina === 1}
            onClick={() =>
              setPagina((p) => p - 1)
            }
          >
            Anterior
          </button>

          <span className="text-sm text-gray-500">
            Página {pagina}
            {' de '}
            {totalPaginas || 1}
          </span>

          <button
            className="
              px-4 py-2 border rounded
              disabled:opacity-50
            "
            disabled={
              pagina >= totalPaginas
            }
            onClick={() =>
              setPagina((p) => p + 1)
            }
          >
            Siguiente
          </button>

        </div>

      </div>

    </div>
  )
}
