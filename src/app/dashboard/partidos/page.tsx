'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

export default function PartidosPage() {
  const router = useRouter()

  const [sesiones, setSesiones] = useState<any[]>([])
  const [planteles, setPlanteles] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])

  const [clienteId, setClienteId] = useState<number | null>(null)

  // MODAL PARTIDO
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  // MODAL EQUIPOS
  const [mostrarEquiposModal, setMostrarEquiposModal] = useState(false)
  const [sesionSeleccionada, setSesionSeleccionada] = useState<any | null>(null)

  // MODAL EQUIPO
  const [mostrarEquipoModal, setMostrarEquipoModal] = useState(false)
  const [modoEdicionEquipo, setModoEdicionEquipo] = useState(false)
  const [equipoEditando, setEquipoEditando] = useState<any>(null)

  // FORM SESION
  const [fecha, setFecha] = useState('')
  const [plantelId, setPlantelId] = useState<number | null>(null)
  const [club, setClub] = useState('')
  const [condicion, setCondicion] = useState('')

  // FORM EQUIPO
  const [equipo, setEquipo] = useState('')
  const [horaPartido, setHoraPartido] = useState('')
  const [ptosFavor, setPtosFavor] = useState<string>('')
  const [ptosContra, setPtosContra] = useState<string>('')

  // FILTROS
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroPlantel, setFiltroPlantel] = useState('')
  const [filtroClub, setFiltroClub] = useState('')

  // PAGINACIÓN
  const [paginaSesiones, setPaginaSesiones] = useState(1)
  const pageSize = 10

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
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
      .eq('tipo', 'PARTIDO')
      .order('fecha', { ascending: false })

    if (clienteid) {
      query = query.eq('clienteid', clienteid)
    }

    const { data } = await query

    setSesiones(data ?? [])
  }

  const cargarPlanteles = async (
    clienteid: number | null
  ) => {
    let query = supabase
      .from('plantel')
      .select('plantelid, categoria, anio')

    if (clienteid) {
      query = query.eq('clienteid', clienteid)
    }

    const { data } = await query

    setPlanteles(data ?? [])
  }

  const cargarEquipos = async (
    sesionid: number
  ) => {
    const { data } = await supabase
      .from('sesion_equipo')
      .select('*')
      .eq('sesionid', sesionid)
      .order('hora_partido', {
        ascending: true
      })

    setEquipos(data ?? [])
  }

  const obtenerLogoCliente = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser()
  
    if (!user) return null
  
    const { data: profile } =
      await supabase
        .from('profiles')
        .select('clienteid')
        .eq('id', user.id)
        .single()
  
    if (!profile?.clienteid) return null
  
    const { data: cliente } =
      await supabase
        .from('cliente')
        .select('logourl')
        .eq(
          'clienteid',
          profile.clienteid
        )
        .single()
  
    return cliente?.logourl || null
  }

  const generarReportePartido = async () => {

    if (!sesionSeleccionada) return
  
    const { data: equiposReporte } =
      await supabase
        .from('sesion_equipo')
        .select('*')
        .eq(
          'sesionid',
          sesionSeleccionada.sesionid
        )
        .order('hora_partido', {
          ascending: true
        })

        const logoUrl =
        await obtenerLogoCliente()

    const formatearFecha = (
      fecha: string
    ) => {
      if (!fecha) return ''
  
      const d = new Date(fecha)
  
      const dia = String(
        d.getDate()
      ).padStart(2, '0')
  
      const mes = String(
        d.getMonth() + 1
      ).padStart(2, '0')
  
      const anio = d.getFullYear()
  
      return `${dia}/${mes}/${anio}`
    }
  
    let htmlEquipos = ''
  
    for (const equipo of equiposReporte || []) {
  
      const { data: asistencias } =
        await supabase
          .from('sesion_asistencia')
          .select(`
            posicion,
            capitan,
            persona:personaid (
              nombre,
              apellido
            )
          `)
          .eq(
            'sesion_equipoid',
            equipo.sesion_equipoid
          )
          .not('posicion', 'is', null)
          .order('posicion', {
            ascending: true
          })
  
      htmlEquipos += `
        <div class="equipo">
  
          <div class="equipo-header">
  
            <div>
              <div class="equipo-titulo">
                ${equipo.equipo}
              </div>
  
              <div class="equipo-sub">
                ${
                    equipo.hora_partido
                      ? equipo.hora_partido.slice(0, 5)
                      : '--:--'
                  }
              </div>
            </div>
  
          </div>
  
          <table>
  
            <thead>
              <tr>
                <th class="col-pos">
                  #
                </th>
  
                <th>
                  Jugador
                </th>
              </tr>
            </thead>
  
            <tbody>
  
              ${(asistencias || [])
                .map(
                  (a: any) => `
                  <tr
                    class="${
                        Number(a.posicion) > 15
                        ? 'suplente'
                        : ''
                    }"
                    >

                    <td class="col-pos">
                        ${a.posicion || ''}
                    </td>

                    <td>
                        ${a.persona?.apellido || ''}, ${a.persona?.nombre || ''}

                        ${
                        a.capitan === true ||
                        a.capitan === 1 ||
                        a.capitan === '1'
                            ? ' ©'
                            : ''
                        }
                    </td>

                    </tr>
                  `
                )
                .join('')}
  
            </tbody>
  
          </table>
  
        </div>
      `
    }
  
    const html = `
      <html>
  
        <head>
  
        <title>
        Planteles vs ${sesionSeleccionada.club} - ${
          formatearFecha(
            sesionSeleccionada.fecha
          )
        }
      </title>
  
          <style>

          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        
          .suplente td {
            background: #eeeeee !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          html,
          body {
            width: 100%;
            height: 100%;
          }
        
          body {
            font-family: Arial;
            padding: 0;
            margin: 0;
            color: #111;
            zoom: 0.92;
          }
        
          h1 {
            margin: 0 0 6px 0;
            font-size: 24px;
          }
        
          .info {
            margin-bottom: 14px;
            font-size: 13px;
            line-height: 1.4;
          }
        
          .equipos-grid {
            display: grid;
            grid-template-columns:
              repeat(
                auto-fit,
                minmax(260px, 1fr)
              );
            gap: 12px;
            align-items: start;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-bottom: 18px;
          }
          
          .logo {
            width: 90px;
            height: 90px;
            object-fit: contain;
          }

          .equipo {
            border: 1px solid #dcdcdc;
            border-radius: 10px;
            padding: 10px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        
          .equipo-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
        
          .equipo-titulo {
            font-size: 16px;
            font-weight: bold;
            line-height: 1.2;
          }
        
          .equipo-sub {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }
        
          .resultado {
            text-align: right;
            font-size: 12px;
            line-height: 1.3;
            white-space: nowrap;
          }
        
          table {
            width: 100%;
            border-collapse: collapse;
          }
        
          th,
          td {
            border: 1px solid #ccc;
            padding: 4px 6px;
            text-align: left;
            font-size: 11px;
            line-height: 1.2;
          }
        
          th {
            background: #f3f3f3;
          }
        
          .col-pos {
            width: 28px;
            min-width: 28px;
            max-width: 28px;
            text-align: center;
            font-weight: bold;
            white-space: nowrap;
          }
        
          tr {
            page-break-inside: avoid;
          }
        
        </style>
  
        </head>
  
<body>

  <div class="header">

    ${
      logoUrl
        ? `
          <img
            src="${logoUrl}"
            class="logo"
          />
        `
        : ''
    }

    <div>

      <h1>
        Vs ${sesionSeleccionada.club}
      </h1>

      <div class="info">
  
        <div>
          <b>Fecha:</b>
          ${formatearFecha(
            sesionSeleccionada.fecha
          )}
        </div>

        <div>
          <b>Condición:</b>
          ${sesionSeleccionada.condicion}
        </div>

      </div>

    </div>

  </div>
  
          <div class="info">
  
            <div>
              <b>Fecha:</b>
              ${formatearFecha(
                sesionSeleccionada.fecha
              )}
            </div>
  
            <div>
              <b>Condición:</b>
              ${sesionSeleccionada.condicion}
            </div>
  
          </div>
  
          <div
          class="equipos-grid"
          style="
            page-break-before: avoid;
            break-before: avoid;
          "
        >
          ${htmlEquipos}
        </div>

        </body>
  
      </html>
    `
  
    const ventana = window.open(
      '',
      '_blank'
    )
  
    if (!ventana) return
  
    ventana.document.open()
    ventana.document.write(html)
    ventana.document.close()
    
    ventana.onload = () => {
      ventana.document.title =
        `Planteles vs ${sesionSeleccionada.club} - ${
          formatearFecha(
            sesionSeleccionada.fecha
          )
        }`
    
      ventana.focus()
    
      setTimeout(() => {
        ventana.print()
      }, 300)
    }
  }
  // -------------------------
  // SESIONES
  // -------------------------
  const guardarSesion = async () => {
    if (
      !fecha ||
      !plantelId ||
      !club ||
      !condicion
    ) return

    if (editandoId) {
      await supabase
        .from('sesion')
        .update({
          fecha,
          tipo: 'PARTIDO',
          plantelid: plantelId,
          club,
          condicion
        })
        .eq('sesionid', editandoId)
    } else {
      const { data: sesionData } =
        await supabase
          .from('sesion')
          .insert({
            fecha,
            tipo: 'PARTIDO',
            plantelid: plantelId,
            clienteid: clienteId,
            club,
            condicion
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
    setPlantelId(s.plantelid)
    setClub(s.club || '')
    setCondicion(s.condicion || '')
    setMostrarModal(true)
  }

  const eliminarSesion = async (
    id: number
  ) => {
    const ok = confirm(
      '¿Eliminar partido?'
    )

    if (!ok) return

    await supabase
      .from('sesion_asistencia')
      .delete()
      .eq('sesionid', id)

    await supabase
      .from('sesion_equipo')
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
    setPlantelId(null)
    setClub('')
    setCondicion('')
  }

  // -------------------------
  // EQUIPOS
  // -------------------------
  const abrirEquipos = async (
    sesion: any
  ) => {
    setSesionSeleccionada(sesion)
    setMostrarEquiposModal(true)

    await cargarEquipos(
      sesion.sesionid
    )
  }

  const abrirNuevoEquipo = () => {
    setModoEdicionEquipo(false)
    setEquipoEditando(null)

    setEquipo('')
    setHoraPartido('')
    setPtosFavor('')
    setPtosContra('')

    setMostrarEquipoModal(true)
  }

  const editarEquipo = (
    item: any
  ) => {
    setModoEdicionEquipo(true)
    setEquipoEditando(item)

    setEquipo(item.equipo || '')
    setHoraPartido(
      item.hora_partido || ''
    )
    setPtosFavor(
      item.ptos_favor?.toString() ?? ''
    )
    setPtosContra(
      item.ptos_contra?.toString() ?? ''
    )

    setMostrarEquipoModal(true)
  }

  const eliminarEquipo = async (
    sesion_equipoid: number
  ) => {
    const ok = confirm(
      '¿Eliminar equipo?'
    )

    if (!ok) return

    await supabase
      .from('sesion_asistencia')
      .update({
        sesion_equipoid: null,
        posicion: null
      })
      .eq(
        'sesion_equipoid',
        sesion_equipoid
      )

    await supabase
      .from('sesion_equipo')
      .delete()
      .eq(
        'sesion_equipoid',
        sesion_equipoid
      )

    cargarEquipos(
      sesionSeleccionada.sesionid
    )
  }

  const toNumberOrNull = (
    v: string
  ) => {
    if (
      v === '' ||
      v === null ||
      v === undefined
    )
      return null

    const n = Number(v)

    return isNaN(n) ? null : n
  }

  const normalizeTime = (
    v: string
  ) => {
    if (!v) return null

    const match =
      v.match(/^(\d{2}:\d{2})/)

    return match ? match[1] : v
  }

  const guardarEquipo = async () => {
    if (
      !equipo ||
      !sesionSeleccionada
    )
      return

    const payload = {
      equipo,
      hora_partido:
        normalizeTime(
          horaPartido
        ),
      ptos_favor:
        toNumberOrNull(
          ptosFavor
        ),
      ptos_contra:
        toNumberOrNull(
          ptosContra
        ),
      sesionid:
        sesionSeleccionada.sesionid
    }

    if (
      modoEdicionEquipo &&
      equipoEditando
    ) {
      await supabase
        .from('sesion_equipo')
        .update(payload)
        .eq(
          'sesion_equipoid',
          equipoEditando.sesion_equipoid
        )
    } else {
      await supabase
        .from('sesion_equipo')
        .insert(payload)
    }

    setMostrarEquipoModal(false)

    cargarEquipos(
      sesionSeleccionada.sesionid
    )
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

        const matchPlantel =
          textoPlantel.includes(
            filtroPlantel.toLowerCase()
          )

        const matchClub =
          (s.club || '')
            .toLowerCase()
            .includes(
              filtroClub.toLowerCase()
            )

        return (
          matchFecha &&
          matchPlantel &&
          matchClub
        )
      })
    }, [
      sesiones,
      planteles,
      filtroFecha,
      filtroPlantel,
      filtroClub
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
    <div className="p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Partidos
        </h1>

        <button
          title="Crear"
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
      <div className="bg-white rounded-2xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">

        <input
          className="border p-2 rounded-xl"
          placeholder="Fecha"
          value={filtroFecha}
          onChange={(e) =>
            setFiltroFecha(
              e.target.value
            )
          }
        />

        <input
          className="border p-2 rounded-xl"
          placeholder="Plantel"
          value={filtroPlantel}
          onChange={(e) =>
            setFiltroPlantel(
              e.target.value
            )
          }
        />

        <input
          className="border p-2 rounded-xl"
          placeholder="Club"
          value={filtroClub}
          onChange={(e) =>
            setFiltroClub(
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
            onClick={() => abrirEquipos(s)}
            className="bg-white rounded-2xl shadow p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="flex flex-col items-start justify-center">

                <div className="font-semibold text-lg">
                  {s.fecha}
                </div>

                <div className="text-sm text-gray-700">
                  {s.club}
                </div>

                <div className="text-sm text-gray-500">
                  {s.condicion}
                </div>

                <div className="text-sm text-gray-500">
                  {plantel
                    ? `${plantel.categoria} - ${plantel.anio}`
                    : 'Sin plantel'}
                </div>

              </div>

              <div className="flex gap-2">


                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    editarSesion(s)
                  }}
                  className="
  cursor-pointer
  hover:scale-110
  active:scale-90
  transition-all
"
                >
                  <img
                    src="/img/edit.png"
                    alt="editar"
                    className="w-5 h-5"
                  />
                </button>

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
      <div className="flex justify-center gap-2 mt-6">

        <button
          className="border px-3 py-1 rounded disabled:opacity-30"
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

        <div className="px-3 py-1">
          {paginaSesiones} /{' '}
          {totalPaginas || 1}
        </div>

        <button
          className="border px-3 py-1 rounded disabled:opacity-30"
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

      {/* MODAL SESION */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-2xl w-[95%] md:w-96 space-y-4">

            <input
              className="border p-2 w-full rounded-xl"
              type="date"
              value={fecha}
              onChange={(e) =>
                setFecha(
                  e.target.value
                )
              }
            />

            <input
              className="border p-2 w-full rounded-xl"
              placeholder="Club"
              value={club}
              onChange={(e) =>
                setClub(
                  e.target.value
                )
              }
            />

            <select
              className="border p-2 w-full rounded-xl"
              value={condicion}
              onChange={(e) =>
                setCondicion(
                  e.target.value
                )
              }
            >
              <option value="">
                Condición
              </option>

              <option value="LOCAL">
                LOCAL
              </option>

              <option value="VISITANTE">
                VISITANTE
              </option>
            </select>

            <select
              className="border p-2 w-full rounded-xl"
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
                  key={
                    p.plantelid
                  }
                  value={
                    p.plantelid
                  }
                >
                  {p.categoria} -{' '}
                  {p.anio}
                </option>
              ))}
            </select>

            <div className="flex gap-2">

              <button
                className="flex-1 bg-black text-white py-2 rounded-xl"
                onClick={
                  guardarSesion
                }
              >
                {editandoId
                  ? 'Actualizar'
                  : 'Crear'}
              </button>

              <button
                className="flex-1 border py-2 rounded-xl"
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

      {/* MODAL EQUIPOS */}
      {mostrarEquiposModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">

            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="text-2xl font-bold">
                  Equipos
                </h2>

                <div className="text-sm text-gray-500">
                  {
                    sesionSeleccionada?.club
                  }{' '}
                  ·{' '}
                  {
                    sesionSeleccionada?.fecha
                  }
                </div>
              </div>

              <button
                onClick={() =>
                  setMostrarEquiposModal(
                    false
                  )
                }
                className="
    bg-white text-black
    px-4 py-2 border rounded-xl
    cursor-pointer
    hover:opacity-90
    hover:scale-[1.03]
    active:scale-95
    transition-all
  "
              >
                X
              </button>

            </div>

            <div className="flex gap-2 mb-4">

                <button
                onClick={abrirNuevoEquipo}
                className="
    bg-black text-white
    px-4 py-2 rounded-xl
    cursor-pointer
    hover:opacity-90
    hover:scale-[1.03]
    active:scale-95
    transition-all
  "
                >
                + Nuevo equipo
                </button>

                <button
                onClick={generarReportePartido}
                className="
    bg-white text-black
    px-4 py-2 border rounded-xl
    cursor-pointer
    hover:opacity-90
    hover:scale-[1.03]
    active:scale-95
    transition-all
  "
                >
                <img
                    src="/img/reporte.png"
                    alt="reporte"
                    className="w-5 h-5"
                />

                PDF con Equipos
                </button>

                </div>

            <div className="space-y-3">
              {equipos.map((e) => (
                <div
                  key={
                    e.sesion_equipoid
                  }
                  className="bg-gray-50 border rounded-2xl p-4 flex justify-between items-center"
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => {
                        setMostrarEquiposModal(false)

                        router.push(
                        `/dashboard/partidos/${sesionSeleccionada.sesionid}/${e.sesion_equipoid}`
                        )
                    }}
                    >
                    <div className="font-semibold text-lg">
                      {e.equipo}
                    </div>

                    {e.hora_partido && (
                      <div className="text-sm text-gray-500">
                        {e.hora_partido?.slice(
                          0,
                          5
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6">


                    <button
                      onClick={() =>
                        editarEquipo(
                          e
                        )
                      }
                      className="
  cursor-pointer
  hover:scale-110
  active:scale-90
  transition-all
"
                    >
                      <img
                        src="/img/edit.png"
                        alt="editar"
                        className="w-5 h-5"
                      />
                    </button>

                    <button
                      onClick={() =>
                        eliminarEquipo(
                          e.sesion_equipoid
                        )
                      }
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
              ))}
            </div>

          </div>

        </div>
      )}

      {/* MODAL EQUIPO */}
      {mostrarEquipoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">

          <div className="bg-white p-6 rounded-2xl w-[95%] md:w-96 space-y-3">

            <h2 className="text-xl font-bold">
              {modoEdicionEquipo
                ? 'Editar equipo'
                : 'Nuevo equipo'}
            </h2>

            <input
              className="border p-2 w-full rounded-xl"
              placeholder="Equipo"
              value={equipo}
              onChange={(e) =>
                setEquipo(
                  e.target.value
                )
              }
            />

            <input
              type="time"
              className="border p-2 w-full rounded-xl"
              value={horaPartido}
              onChange={(e) =>
                setHoraPartido(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              className="border p-2 w-full rounded-xl"
              placeholder="Puntos a favor"
              value={ptosFavor}
              onChange={(e) =>
                setPtosFavor(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              className="border p-2 w-full rounded-xl"
              placeholder="Puntos en contra"
              value={ptosContra}
              onChange={(e) =>
                setPtosContra(
                  e.target.value
                )
              }
            />

            <div className="flex gap-2 pt-2">

              <button
                onClick={
                  guardarEquipo
                }
                className="flex-1 bg-black text-white py-2 rounded-xl"
              >
                Guardar
              </button>

              <button
                onClick={() =>
                  setMostrarEquipoModal(
                    false
                  )
                }
                className="flex-1 border py-2 rounded-xl"
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