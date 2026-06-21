'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CalendarioGeneralPage() {
  const [sesiones, setSesiones] = useState<any[]>([])
  const [planteles, setPlanteles] = useState<any[]>([])
  const [plantelesUsuarioIds, setPlantelesUsuarioIds] =
  useState<number[]>([])
  const [clienteId, setClienteId] =
    useState<number | null>(null)

  const router = useRouter()

  // MODAL EQUIPOS
  const [mostrarEquiposModal, setMostrarEquiposModal] =
    useState(false)

  // FORM EQUIPO
  const [equipo, setEquipo] = useState('')
  const [horaPartido, setHoraPartido] = useState('')
  const [ptosFavor, setPtosFavor] = useState<string>('')
  const [ptosContra, setPtosContra] = useState<string>('')

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

  const [sesionSeleccionada, setSesionSeleccionada] =
    useState<any | null>(null)

  const [equipos, setEquipos] =
    useState<any[]>([])

  const [currentDate, setCurrentDate] =
    useState(new Date())

  const hoyRef = useRef<HTMLDivElement | null>(null)

  const [draggedSesion, setDraggedSesion] =
    useState<any>(null)

  const [modoEdicion, setModoEdicion] =
    useState(false)

  const [sesionEditando, setSesionEditando] =
    useState<any>(null)

  const [filtroPlantel, setFiltroPlantel] =
    useState('')

  const [filtroTipo, setFiltroTipo] =
    useState('')

  const [mostrarModal, setMostrarModal] =
    useState(false)

  const [fecha, setFecha] = useState('')

  const [tipo, setTipo] =
    useState('ENTRENAMIENTO')

  const [hora, setHora] = useState('')

  const [club, setClub] = useState('')

  const [condicion, setCondicion] =
    useState('LOCAL')

  const [plantelId, setPlantelId] =
    useState<number | null>(null)

  const calendarioRef =
    useRef<HTMLDivElement | null>(null)

  const headerRef =
    useRef<HTMLDivElement | null>(null)

  const firstLoadRef = useRef(true)

  const [presentesMap, setPresentesMap] =
    useState<Record<number, number>>({})

  const [esMobileVertical, setEsMobileVertical] =
    useState(false)

  const scrollToRef = (
    ref: HTMLDivElement | null
  ) => {
    if (!ref) return

    const headerOffset = 215

    const elementPosition =
      ref.getBoundingClientRect().top

    const offsetPosition =
      window.scrollY +
      elementPosition -
      headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }

  // MODAL EQUIPO
  const [mostrarEquipoModal, setMostrarEquipoModal] = useState(false)
  const [modoEdicionEquipo, setModoEdicionEquipo] = useState(false)
  const [equipoEditando, setEquipoEditando] = useState<any>(null)

  const scrollToToday = () => {
    if (!hoyRef.current) return

    const headerOffset = 215

    const rect =
      hoyRef.current.getBoundingClientRect()

    const top =
      window.scrollY +
      rect.top -
      headerOffset

    window.scrollTo({
      top,
      behavior: 'smooth'
    })
  }

  const scrollToTopOfCalendar = () => {
    if (!calendarioRef.current) return

    const headerOffset = 215

    const elementPosition =
      calendarioRef.current.getBoundingClientRect()
        .top

    const offsetPosition =
      window.scrollY +
      elementPosition -
      headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    const check = () => {
      setEsMobileVertical(
        window.innerWidth < 768 &&
          window.innerHeight >
            window.innerWidth
      )
    }

    check()

    window.addEventListener(
      'resize',
      check
    )

    window.addEventListener(
      'orientationchange',
      check
    )

    return () => {
      window.removeEventListener(
        'resize',
        check
      )

      window.removeEventListener(
        'orientationchange',
        check
      )
    }
  }, [])

  useEffect(() => {
    if (!sesiones.length) return

    if (hoyRef.current) {
      setTimeout(() => {
        scrollToRef(hoyRef.current)
      }, 300)
    }
  }, [sesiones, currentDate])

  useEffect(() => {
    if (!sesiones.length) return
    if (!firstLoadRef.current) return

    firstLoadRef.current = false

    requestAnimationFrame(() => {
      hoyRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }, [sesiones])

  useEffect(() => {
    if (
      esMobileVertical &&
      hoyRef.current
    ) {
      setTimeout(() => {
        scrollToToday()
      }, 200)
    }
  }, [esMobileVertical, currentDate])

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
  
    setClienteId(profile?.clienteid)
  
    // PLANTELES ASOCIADOS
    const { data: plantelesUsuario } =
      await supabase
        .from('plantel_usuario')
        .select('plantelid')
        .eq('usuario', user.id)
  
    const ids =
      (plantelesUsuario ?? []).map(
        p => p.plantelid
      )
  
    setPlantelesUsuarioIds(ids)
  
    cargarPlanteles(profile?.clienteid)
    cargarSesiones(profile?.clienteid)
  }

  const cargarPlanteles = async (
    clienteid: number | null
  ) => {
    let query = supabase
      .from('plantel')
      .select('*')
      .order('categoria')

    if (clienteid) {
      query = query.eq(
        'clienteid',
        clienteid
      )
    }

    const { data } = await query

    setPlanteles(data ?? [])
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

  const cargarPresentes = async (
  sesionesData: any[]
) => {
  if (!sesionesData.length) {
    setPresentesMap({})
    return
  }

  const sesionIds = sesionesData.map(
    (s) => s.sesionid
  )

  const { data } = await supabase
    .from('sesion_asistencia')
    .select('sesionid')
    .in('sesionid', sesionIds)
    .eq('asistencia', true)

  const map: Record<number, number> = {}

  ;(data ?? []).forEach((a) => {
    map[a.sesionid] =
      (map[a.sesionid] || 0) + 1
  })

  setPresentesMap(map)
}

  const cargarSesiones = async (
    clienteid: number | null
  ) => {
  
    const {
      data: { user }
    } = await supabase.auth.getUser()
  
    if (!user) return
  
    // PLANTELES ASOCIADOS AL USUARIO
    const { data: plantelesUsuario } =
      await supabase
        .from('plantel_usuario')
        .select('plantelid')
        .eq('usuario', user.id)
  
    const plantelIds =
      (plantelesUsuario ?? []).map(
        (p) => p.plantelid
      )
  
    let query = supabase
      .from('sesion')
      .select('*')
      .order('fecha', {
        ascending: true
      })
  
    // SI TIENE PLANTELES ASOCIADOS,
    // FILTRAR SOLO ESOS
    if (plantelIds.length > 0) {
      query = query.in(
        'plantelid',
        plantelIds
      )
    }
  
    // FILTRO CLIENTE
    if (clienteid) {
      query = query.eq(
        'clienteid',
        clienteid
      )
    }
  
    const { data } = await query
  
    const sesionesData = data ?? []
  
    setSesiones(sesionesData)
  
    await cargarPresentes(
      sesionesData
    )
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

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(
    year,
    month,
    1
  )

  const lastDayOfMonth = new Date(
    year,
    month + 1,
    0
  )

  const daysInMonth =
    lastDayOfMonth.getDate()

  const startDay =
    firstDayOfMonth.getDay()

  const monthName =
    currentDate.toLocaleString(
      'es-AR',
      {
        month: 'long'
      }
    )

  const todayString = new Date()
    .toLocaleDateString('sv-SE')

  const plantelesMap = useMemo(() => {
    const map: any = {}

    planteles.forEach((p) => {
      map[p.plantelid] = p
    })

    return map
  }, [planteles])

  const days = useMemo(() => {
    const arr = []

    for (let i = 0; i < startDay; i++) {
      arr.push(null)
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      arr.push(day)
    }

    return arr
  }, [daysInMonth, startDay])

  const sesionesPorDia = (
    day: number
  ) => {
    const fecha =
      `${year}-${String(
        month + 1
      ).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`

    return sesiones
      .filter((s) => {
        const matchPlantel =
          filtroPlantel === '' ||
          String(s.plantelid) ===
            filtroPlantel

        const matchTipo =
          filtroTipo === '' ||
          s.tipo === filtroTipo

        return (
          s.fecha === fecha &&
          matchPlantel &&
          matchTipo
        )
      })
      .sort((a, b) => {
        return (
          a.hora || ''
        ).localeCompare(
          b.hora || ''
        )
      })
  }

  const prevMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    )

    setTimeout(
      scrollToTopOfCalendar,
      100
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    )

    setTimeout(
      scrollToTopOfCalendar,
      100
    )
  }

  const moverSesion = async (
    nuevaFecha: string
  ) => {
    if (!draggedSesion) return

    await supabase
      .from('sesion')
      .update({
        fecha: nuevaFecha
      })
      .eq(
        'sesionid',
        draggedSesion.sesionid
      )

    setDraggedSesion(null)

    cargarSesiones(clienteId)
  }

  const eliminarSesion = async (
    sesionid: number
  ) => {
    const ok = confirm(
      '¿Eliminar sesión?'
    )

    if (!ok) return

    await supabase
      .from('sesion_asistencia')
      .delete()
      .eq('sesionid', sesionid)

    await supabase
      .from('sesion')
      .delete()
      .eq('sesionid', sesionid)

    cargarSesiones(clienteId)
  }

  const abrirNuevaSesion = (
    day: number
  ) => {
    const nuevaFecha =
      `${year}-${String(
        month + 1
      ).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`

    setFecha(nuevaFecha)
    setTipo('ENTRENAMIENTO')
    setHora('')
    setClub('')
    setCondicion('LOCAL')
    setPlantelId(null)

    setModoEdicion(false)
    setSesionEditando(null)

    setMostrarModal(true)
  }

  const editarSesion = (
    sesion: any
  ) => {
    setModoEdicion(true)
    setSesionEditando(sesion)

    setFecha(sesion.fecha || '')

    setTipo(
      sesion.tipo || 'ENTRENAMIENTO'
    )

    setHora(sesion.hora || '')
    setClub(sesion.club || '')

    setCondicion(
      sesion.condicion || 'LOCAL'
    )

    setPlantelId(
      sesion.plantelid || null
    )

    setMostrarModal(true)
  }

  const abrirEquipos = async (
    sesion: any
  ) => {
    setSesionSeleccionada(sesion)

    setMostrarEquiposModal(true)

    await cargarEquipos(
      sesion.sesionid
    )
  }

  const guardarSesion = async () => {
    if (
      !fecha ||
      !tipo ||
      !plantelId
    )
      return

    if (
      modoEdicion &&
      sesionEditando
    ) {
      await supabase
        .from('sesion')
        .update({
          fecha,
          tipo,
          hora,
          plantelid: plantelId,
          club:
            tipo === 'PARTIDO'
              ? club
              : null,
          condicion:
            tipo === 'PARTIDO'
              ? condicion
              : null
        })
        .eq(
          'sesionid',
          sesionEditando.sesionid
        )

      setMostrarModal(false)

      cargarSesiones(clienteId)

      return
    }

    const { data: sesionData } =
      await supabase
        .from('sesion')
        .insert({
          fecha,
          tipo,
          hora,
          plantelid: plantelId,
          clienteid: clienteId,
          club:
            tipo === 'PARTIDO'
              ? club
              : null,
          condicion:
            tipo === 'PARTIDO'
              ? condicion
              : null
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

    setMostrarModal(false)

    cargarSesiones(clienteId)
  }

  const nombresDias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ]

  const plantelesDisponibles =
  plantelesUsuarioIds.length > 0
    ? planteles.filter(p =>
        plantelesUsuarioIds.includes(
          p.plantelid
        )
      )
    : planteles

  return (
    <div className="px-3 pb-6 md:px-8 bg-gray-100 min-h-screen">

      <div
        className="sticky top-[64px] z-30 bg-gray-100 border-b border-gray-200 pb-3"
        ref={headerRef}
      >

        {/* TOP BAR */}
        <div className="pt-2 pb-2 flex items-center justify-between px-2 h-[56px]">

          <h1 className="text-xl md:text-2xl font-bold leading-none">
            Calendario
          </h1>

          <div className="flex items-center gap-2">


            <div className="flex items-center gap-1 bg-white shadow-sm rounded-xl px-2 py-1 h-[40px]">

              <button
                onClick={prevMonth}
                className="
                  cursor-pointer
                  w-8 h-8
                  flex items-center justify-center
                  rounded-lg
                  hover:bg-gray-100
                  active:scale-95
                  transition
                "
              >
                ←
              </button>

              <div className="flex flex-col items-center min-w-[110px] leading-tight">
                <div className="text-sm font-semibold capitalize">
                  {monthName}
                </div>

                <div className="text-[10px] text-gray-400">
                  {year}
                </div>
              </div>

              <button
                onClick={nextMonth}
                className="
                  cursor-pointer
                  w-8 h-8
                  flex items-center justify-center
                  rounded-lg
                  hover:bg-gray-100
                  active:scale-95
                  transition
                "
              >
                →
              </button>

            </div>

          </div>

        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-2 gap-2 mt-3 px-2">

          <select
            className="
              border rounded-xl
              px-3 py-2
              bg-white
              cursor-pointer
            "
            value={filtroPlantel}
            onChange={(e) =>
              setFiltroPlantel(
                e.target.value
              )
            }
          >
            <option value="">
              Todos los planteles
            </option>

            {plantelesDisponibles.map((p) => (
              <option
                key={p.plantelid}
                value={p.plantelid}
              >
                {p.categoria} - {p.anio}
              </option>
            ))}
          </select>

          <select
            className="
              border rounded-xl
              px-3 py-2
              bg-white
              cursor-pointer
            "
            value={filtroTipo}
            onChange={(e) =>
              setFiltroTipo(
                e.target.value
              )
            }
          >
            <option value="">
              Todos los eventos
            </option>

            <option value="ENTRENAMIENTO">
              Entrenamiento
            </option>

            <option value="PARTIDO">
              Partido
            </option>
          </select>

        </div>

        {!esMobileVertical && (
          <div className="sticky top-[96px] z-20 bg-gray-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 pt-2">

            {[
              'Dom',
              'Lun',
              'Mar',
              'Mié',
              'Jue',
              'Vie',
              'Sáb'
            ].map((d) => (
              <div
                key={d}
                className="text-center text-sm font-semibold text-gray-600"
              >
                {d}
              </div>
            ))}

          </div>
        )}

      </div>

      <div
        ref={calendarioRef}
        className={`
          ${
            esMobileVertical
              ? 'flex flex-col gap-3 mt-3'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 mt-2'
          }
        `}
      >

        {days.map((day, idx) => {

          if (!day && !esMobileVertical) {
            return (
              <div
                key={idx}
                className="h-44"
              />
            )
          }

          if (!day) return null

          const sesionesDia =
            sesionesPorDia(day)

          const fechaActual =
            `${year}-${String(
              month + 1
            ).padStart(2, '0')}-${String(
              day
            ).padStart(2, '0')}`

          const esHoy =
            fechaActual === todayString

          return (
            <div
              key={idx}
              ref={
                esHoy
                  ? hoyRef
                  : null
              }
              className={`
                bg-white
                rounded-2xl
                shadow
                p-3
                overflow-y-auto
                transition-all
                scroll-mt-[240px]
                md:scroll-mt-[180px]

                ${
                  esMobileVertical
                    ? 'min-h-[120px]'
                    : 'min-h-40 md:h-52'
                }

                ${
                  esHoy
                    ? `
                      ring-4
                      ring-yellow-300
                      border-2
                      border-yellow-400
                      bg-yellow-50
                    `
                    : ''
                }
              `}
              onDragOver={(e) =>
                e.preventDefault()
              }
              onDrop={() =>
                moverSesion(
                  fechaActual
                )
              }
            >

              <div className="flex items-center justify-between mb-3">

                <div>

                  {esMobileVertical && (
                    <div className="text-xs text-gray-500 font-semibold">
                      {
                        nombresDias[
                          new Date(
                            year,
                            month,
                            day
                          ).getDay()
                        ]
                      }
                    </div>
                  )}

                  <div className="flex items-center gap-2">

                    <div className="font-bold text-lg">
                      {day}
                    </div>


                  </div>

                </div>

                <button
                  onClick={() =>
                    abrirNuevaSesion(day)
                  }
                  className="
                    cursor-pointer
                    active:scale-90
                    transition-all
                    bg-black
                    text-white
                    rounded-xl
                    w-8 h-8
                    flex items-center justify-center
                    shadow
                    hover:shadow-lg
                  "
                >
                  +
                </button>

              </div>

              <div className="space-y-2">

                {sesionesDia.map((s) => {

                  const plantel =
                    plantelesMap[
                      s.plantelid
                    ]

                  return (
                    <div
                      key={s.sesionid}
                      draggable
                      onDragStart={() =>
                        setDraggedSesion(s)
                      }
                      onClick={() =>
                        editarSesion(s)
                      }
                      className={`
                        rounded-2xl
                        p-3
                        text-black
                        cursor-pointer
                        active:scale-[0.98]
                        hover:scale-[1.01]
                        transition-all
                        shadow-sm
                        hover:shadow-md

                        ${
                          s.tipo ===
                          'PARTIDO'
                            ? 'bg-[#99acff]'
                            : 'bg-[#c1ff72]'
                        }
                      `}
                    >

                      <div className="flex items-start justify-between gap-2">

                        <div className="min-w-0">

                          <div className="font-bold text-xs uppercase">
                            {s.tipo ===
                            'PARTIDO'
                              ? 'PARTIDO'
                              : 'ENTRENAMIENTO'}
                          </div>

                          <div className="font-semibold text-sm truncate">
                            {
                              plantel?.categoria
                            }{' '}
                            -{' '}
                            {
                              plantel?.anio
                            }
                          </div>

                          {s.hora && (
                            <div className="text-xs">
                              {s.hora.slice(
                                0,
                                5
                              )}
                            </div>
                          )}

                          {s.club && (
                            <div className="text-xs truncate">
                              vs {s.club}
                            </div>
                          )}

                          {s.tipo ===
                            'ENTRENAMIENTO' && (
                            <div className="flex items-center gap-1 mt-2">

                              <img
                                src="/img/usuario.png"
                                alt="presentes"
                                className="
                                  w-4 h-4
                                  opacity-70
                                "
                              />

                              <div className="text-xs font-semibold">
                                {
                                  presentesMap[
                                    s.sesionid
                                  ] || 0
                                }
                              </div>

                            </div>
                          )}

                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()

                            eliminarSesion(
                              s.sesionid
                            )
                          }}
                          className="
                            cursor-pointer
                            active:scale-90
                            transition-all
                            text-black
                            font-bold
                            text-sm
                            w-6 h-6
                            flex items-center justify-center
                            rounded-lg
                            hover:bg-white/40
                          "
                        >
                          ✕
                        </button>

                      </div>

                    </div>
                  )
                })}


              </div>

            </div>
          )
        })}

      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">

            <div className="text-2xl font-bold">
              {modoEdicion
                ? 'Editar sesión'
                : 'Nueva sesión'}
            </div>

            <input
              type="date"
              className="border p-3 w-full rounded-xl"
              value={fecha}
              onChange={(e) =>
                setFecha(
                  e.target.value
                )
              }
            />

            <input
              type="time"
              className="border p-3 w-full rounded-xl"
              value={hora}
              onChange={(e) =>
                setHora(
                  e.target.value
                )
              }
            />

            <select
              className="border p-3 w-full rounded-xl cursor-pointer"
              value={tipo}
              onChange={(e) =>
                setTipo(
                  e.target.value
                )
              }
            >
              <option value="ENTRENAMIENTO">
                ENTRENAMIENTO
              </option>

              <option value="PARTIDO">
                PARTIDO
              </option>
            </select>

            <select
              className="border p-3 w-full rounded-xl cursor-pointer"
              value={plantelId || ''}
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

              {plantelesDisponibles.map((p) => (
                <option
                  key={p.plantelid}
                  value={p.plantelid}
                >
                  {p.categoria} -{' '}
                  {p.anio}
                </option>
              ))}
            </select>

            {tipo === 'PARTIDO' && (
              <>

                <input
                  className="border p-3 w-full rounded-xl"
                  placeholder="Club"
                  value={club}
                  onChange={(e) =>
                    setClub(
                      e.target.value
                    )
                  }
                />

                <select
                  className="border p-3 w-full rounded-xl cursor-pointer"
                  value={condicion}
                  onChange={(e) =>
                    setCondicion(
                      e.target.value
                    )
                  }
                >
                  <option value="LOCAL">
                    LOCAL
                  </option>

                  <option value="VISITANTE">
                    VISITANTE
                  </option>
                </select>

              </>
            )}

            {modoEdicion &&
              sesionEditando?.tipo ===
                'ENTRENAMIENTO' && (
                <button
                  onClick={() => {
                    setMostrarModal(false)

                    router.push(
                      `/dashboard/sesiones/${sesionEditando.sesionid}`
                    )
                  }}
                  className="
                    cursor-pointer
                    active:scale-95
                    transition-all
                    w-full
                    bg-blue-600
                    text-white
                    py-3
                    rounded-xl
                  "
                >
                  Ir a asistencia
                </button>
              )}

            {modoEdicion &&
              sesionEditando?.tipo ===
                'PARTIDO' && (
                <button
                  onClick={() => {

                    setMostrarModal(false)

                    abrirEquipos(
                      sesionEditando
                    )
                  }}
                  className="
                    cursor-pointer
                    active:scale-95
                    transition-all
                    w-full
                    bg-blue-600
                    text-white
                    py-3
                    rounded-xl
                  "
                >
                  Ver equipos
                </button>
              )}

            <div className="flex gap-2">

              <button
                onClick={guardarSesion}
                className="
                  cursor-pointer
                  active:scale-95
                  transition-all
                  flex-1
                  bg-black
                  text-white
                  py-3
                  rounded-xl
                "
              >
                {modoEdicion
                  ? 'Guardar cambios'
                  : 'Crear'}
              </button>

              <button
                onClick={() =>
                  setMostrarModal(false)
                }
                className="
                  cursor-pointer
                  active:scale-95
                  transition-all
                  flex-1
                  border
                  py-3
                  rounded-xl
                "
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
                  className="bg-gray-50 border rounded-2xl p-4 flex justify-between items-center hover:bg-gray-200"
                >
                  <div
                    className="cursor-pointer flex-1 "
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
{/* MODAL CREAR / EDITAR EQUIPO */}
{mostrarEquipoModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">

    <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">

      <div className="text-2xl font-bold">
        {modoEdicionEquipo
          ? 'Editar equipo'
          : 'Nuevo equipo'}
      </div>

      <input
        className="border p-3 w-full rounded-xl"
        placeholder="Nombre del equipo"
        value={equipo}
        onChange={(e) =>
          setEquipo(e.target.value)
        }
      />

      <input
        type="time"
        className="border p-3 w-full rounded-xl"
        value={horaPartido}
        onChange={(e) =>
          setHoraPartido(
            e.target.value
          )
        }
      />

      <div className="grid grid-cols-2 gap-2">

        <input
          type="number"
          className="border p-3 w-full rounded-xl"
          placeholder="Pts favor"
          value={ptosFavor}
          onChange={(e) =>
            setPtosFavor(
              e.target.value
            )
          }
        />

        <input
          type="number"
          className="border p-3 w-full rounded-xl"
          placeholder="Pts contra"
          value={ptosContra}
          onChange={(e) =>
            setPtosContra(
              e.target.value
            )
          }
        />

      </div>

      <div className="flex gap-2">

        <button
          onClick={guardarEquipo}
          className="
            flex-1
            bg-black
            text-white
            py-3
            rounded-xl
            cursor-pointer
            hover:opacity-90
            active:scale-95
            transition-all
          "
        >
          {modoEdicionEquipo
            ? 'Guardar cambios'
            : 'Crear equipo'}
        </button>

        <button
          onClick={() =>
            setMostrarEquipoModal(false)
          }
          className="
            flex-1
            border
            py-3
            rounded-xl
            cursor-pointer
            hover:bg-gray-100
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
