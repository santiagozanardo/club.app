'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

export default function ArmadoPage() {
  const { sesionid, sesion_equipoid } = useParams()

  const [disponibles, setDisponibles] = useState<any[]>([])
  const [equipo, setEquipo] = useState<any[]>([])
  const [equipoInfo, setEquipoInfo] = useState<any | null>(null)
  const [sesion, setSesion] = useState<any | null>(null)

  const [lastTap, setLastTap] = useState<{
    id: number | null
    time: number
  }>({
    id: null,
    time: 0
  })

  const [filtro, setFiltro] = useState('')

  const [filtroNombre, setFiltroNombre] =
  useState('')

const [filtroPosicion, setFiltroPosicion] =
  useState('')

  const [lesionesActivas, setLesionesActivas] =
  useState<Record<number, string>>({})

  const cargarLesiones = async () => {

    const { data } = await supabase
      .from('lesion')
      .select(`
        personaid,
        estado
      `)
  
    const mapa: Record<number, string> = {}
  
    ;(data ?? []).forEach((l) => {
  
      if (
        l.personaid &&
        l.estado === 'ACTIVA'
      ) {
        mapa[l.personaid] = 'ACTIVA'
      }
    })
  
    setLesionesActivas(mapa)
  }

  
const prioridades: Record<number, string[]> = {
  1: ['PILARIZQ', 'PILARDER', 'HOOKER'],
  2: ['HOOKER', 'PILARIZQ', 'PILARDER'],
  3: ['PILARDER', 'HOOKER', 'PILARIZQ'],
  4: ['SEGUNDA', 'OCTAVO', 'ALA'],
  5: ['SEGUNDA', 'OCTAVO', 'ALA'],
  6: ['ALA', 'OCTAVO', 'SEGUNDA'],
  7: ['ALA', 'OCTAVO', 'SEGUNDA'],
  8: ['OCTAVO', 'SEGUNDA', 'ALA'],
  9: ['MEDIOSCR', 'WING'],
  10: ['APERTURA', 'CENTRO'],
  11: ['WING', 'FULLBACK', 'CENTRO'],
  12: ['CENTRO', 'APERTURA', 'WING'],
  13: ['CENTRO', 'APERTURA', 'WING'],
  14: ['WING', 'FULLBACK', 'CENTRO'],
  15: ['FULLBACK', 'WING', 'APERTURA']
}

  const [modalPos, setModalPos] =
    useState<number | null>(null)

  const [modalOpen, setModalOpen] =
    useState(false)

  useEffect(() => {
    if (sesionid && sesion_equipoid) {
      cargar()
      cargarEquipoInfo()
      cargarSesion()
      cargarLesiones()
    }
  }, [sesionid, sesion_equipoid])

  // -------------------------
  // LOADS
  // -------------------------
  const cargarSesion = async () => {
    const { data } = await supabase
      .from('sesion')
      .select(`fecha, club, plantelid`)
      .eq('sesionid', sesionid)
      .single()

    setSesion(data)
  }

  const cargarEquipoInfo = async () => {
    const { data } = await supabase
      .from('sesion_equipo')
      .select('*')
      .eq('sesion_equipoid', sesion_equipoid)
      .single()

    setEquipoInfo(data)
  }

  const toggleCapitan = async (player: any) => {
    if (player.capitan) {
      await supabase
        .from('sesion_asistencia')
        .update({
          capitan: 0
        })
        .eq(
          'sesion_asistenciaid',
          player.sesion_asistenciaid
        )

      cargar()
      return
    }

    await supabase
      .from('sesion_asistencia')
      .update({
        capitan: 0
      })
      .eq(
        'sesion_equipoid',
        sesion_equipoid
      )

    await supabase
      .from('sesion_asistencia')
      .update({
        capitan: 1
      })
      .eq(
        'sesion_asistenciaid',
        player.sesion_asistenciaid
      )

    cargar()
  }

  const cargar = async () => {

    const { data } = await supabase
      .from('sesion_asistencia')
      .select(`
        sesion_asistenciaid,
        personaid,
        sesion_equipoid,
        posicion,
        capitan,
        persona:personaid (
          nombre,
          apellido,
          posicion
        )
      `)
      .eq('sesionid', sesionid)
  
    const all = data ?? []
  
    setDisponibles(
      all.filter(
        p => !p.sesion_equipoid
      )
    )
  
    setEquipo(
      all
        .filter(
          p =>
            p.sesion_equipoid ==
            sesion_equipoid
        )
        .sort(
          (a, b) =>
            (a.posicion || 0) -
            (b.posicion || 0)
        )
    )
  
    // NUEVO
    await cargarLesiones()
  }

  // -------------------------
  // SINCRONIZAR PLANTEL
  // -------------------------
  const actualizarDesdePlantel = async () => {
    if (!sesion?.plantelid) return

    const { data: plantel } = await supabase
      .from('plantel_persona')
      .select('personaid')
      .eq('plantelid', sesion.plantelid)

    const plantelIds = (plantel ?? []).map(p => p.personaid)

    const { data: asistencia } = await supabase
      .from('sesion_asistencia')
      .select('sesion_asistenciaid, personaid')
      .eq('sesionid', sesionid)

    const asistenciaArr = asistencia ?? []

    const asistenciaIds = asistenciaArr.map(a => a.personaid)

    const nuevos = plantelIds
      .filter(id => !asistenciaIds.includes(id))
      .map(id => ({
        sesionid,
        personaid: id,
        sesion_equipoid: null,
        posicion: null
      }))

    if (nuevos.length) {
      await supabase.from('sesion_asistencia').insert(nuevos)
    }

    const aEliminar = asistenciaArr.filter(
      a => !plantelIds.includes(a.personaid)
    )

    if (aEliminar.length) {
      await supabase
        .from('sesion_asistencia')
        .delete()
        .in(
          'sesion_asistenciaid',
          aEliminar.map(a => a.sesion_asistenciaid)
        )
    }

    await cargar()
  }

  // -------------------------
  // LOGICA
  // -------------------------
  const asignar = async (item: any, pos: number) => {

    // si NO es suplente
    if (pos <= 15) {
  
      // buscar si ya hay alguien en esa posición
      const ocupado = equipo.find(
        e => e.posicion === pos
      )
  
      // si existe y NO es el mismo jugador
      if (
        ocupado &&
        ocupado.sesion_asistenciaid !==
          item.sesion_asistenciaid
      ) {
  
        // sacar al jugador actual
        await supabase
          .from('sesion_asistencia')
          .update({
            sesion_equipoid: null,
            posicion: null
          })
          .eq(
            'sesion_asistenciaid',
            ocupado.sesion_asistenciaid
          )
      }
    }
  
    // asignar nuevo jugador
    await supabase
      .from('sesion_asistencia')
      .update({
        sesion_equipoid,
        posicion: pos
      })
      .eq(
        'sesion_asistenciaid',
        item.sesion_asistenciaid
      )
  
    cargar()
  }

  const quitar = async (item: any) => {
    await supabase
      .from('sesion_asistencia')
      .update({
        sesion_equipoid: null,
        posicion: null
      })
      .eq('sesion_asistenciaid', item.sesion_asistenciaid)

    cargar()
  }

  const handleDoubleTapCapitan = async (
    player: any
  ) => {
    const now = Date.now()

    const isDoubleTap =
      lastTap.id === player.sesion_asistenciaid &&
      now - lastTap.time < 350

    if (isDoubleTap) {
      await toggleCapitan(player)
    }

    setLastTap({
      id: player.sesion_asistenciaid,
      time: now
    })
  }

  const get = (pos: number) =>
    equipo.find(e => e.posicion === pos)

  const disponiblesFiltrados = [...disponibles]

  .filter(p => {

    const texto = `
      ${p.persona?.apellido || ''}
      ${p.persona?.nombre || ''}
      ${p.persona?.posicion || ''}
    `.toLowerCase()

    return texto.includes(
      filtro.toLowerCase()
    )
  })

  .sort((a, b) => {

    if (!modalPos) return 0

    const prioridad =
      prioridades[modalPos] || []

    const posA =
      a.persona?.posicion || ''

    const posB =
      b.persona?.posicion || ''

    const indexA = prioridad.indexOf(posA)
    const indexB = prioridad.indexOf(posB)

    const rankA =
      indexA === -1 ? 999 : indexA

    const rankB =
      indexB === -1 ? 999 : indexB

    return rankA - rankB
  })

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-4 bg-gray-100 min-h-screen space-y-4">

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-4 text-center space-y-2">

        <div className="text-xl font-bold">
          {equipoInfo?.equipo} vs {sesion?.club}
        </div>

        <div className="text-sm text-gray-500">
          {sesion?.fecha} · {equipoInfo?.hora_partido?.slice(0, 5)}
        </div>

        <div className="flex justify-center gap-8 pt-2">
          <div>
            <div className="text-xs text-gray-400">
              PTOS FAVOR
            </div>

            <div className="text-lg font-bold">
              {equipoInfo?.ptos_favor ?? '-'}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400">
              PTOS CONTRA
            </div>

            <div className="text-lg font-bold">
              {equipoInfo?.ptos_contra ?? '-'}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">


        {/* CANCHA */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="w-full max-w-[430px] bg-green-700 rounded-xl p-3 shadow space-y-2">

            <Row>
              {[1,2,3].map(pos => (
                <Cell
                  key={pos}
                  pos={pos}
                  player={get(pos)}
                  quitar={quitar}
                  toggleCapitan={toggleCapitan}
                  handleDoubleTapCapitan={handleDoubleTapCapitan}
                  setModalOpen={setModalOpen}
                  setModalPos={setModalPos}
                  lesionesActivas={lesionesActivas}
                />
              ))}
            </Row>

            <Row>
              {[4,5].map(pos => (
                <Cell
                  key={pos}
                  pos={pos}
                  player={get(pos)}
                  quitar={quitar}
                  toggleCapitan={toggleCapitan}
                  handleDoubleTapCapitan={handleDoubleTapCapitan}
                  setModalOpen={setModalOpen}
                  setModalPos={setModalPos}
                  lesionesActivas={lesionesActivas}
                />
              ))}
            </Row>

            <Row>
              {[6,8,7].map(pos => (
                <Cell
                  key={pos}
                  pos={pos}
                  player={get(pos)}
                  quitar={quitar}
                  toggleCapitan={toggleCapitan}
                  handleDoubleTapCapitan={handleDoubleTapCapitan}
                  setModalOpen={setModalOpen}
                  setModalPos={setModalPos}
                  lesionesActivas={lesionesActivas}
                />
              ))}
            </Row>

            <Row>
              {[9,10].map(pos => (
                <Cell
                  key={pos}
                  pos={pos}
                  player={get(pos)}
                  quitar={quitar}
                  toggleCapitan={toggleCapitan}
                  handleDoubleTapCapitan={handleDoubleTapCapitan}
                  setModalOpen={setModalOpen}
                  setModalPos={setModalPos}
                  lesionesActivas={lesionesActivas}
                />
              ))}
            </Row>

            <Row>
              {[11,12,13,14].map(pos => (
                <Cell
                  key={pos}
                  pos={pos}
                  player={get(pos)}
                  quitar={quitar}
                  toggleCapitan={toggleCapitan}
                  handleDoubleTapCapitan={handleDoubleTapCapitan}
                  setModalOpen={setModalOpen}
                  setModalPos={setModalPos}
                  lesionesActivas={lesionesActivas}
                />
              ))}
            </Row>

            <Row>
              {[15].map(pos => (
                <Cell
                  key={pos}
                  pos={pos}
                  player={get(pos)}
                  quitar={quitar}
                  toggleCapitan={toggleCapitan}
                  handleDoubleTapCapitan={handleDoubleTapCapitan}
                  setModalOpen={setModalOpen}
                  setModalPos={setModalPos}
                  lesionesActivas={lesionesActivas}
                />
              ))}
            </Row>

          </div>
        </div>

        {/* SUPLENTES */}
        <div className="bg-white rounded-xl p-3 shadow h-fit">

          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm">
              Suplentes directos
            </h2>

            <button
              onClick={() => {
                setModalPos(999)
                setModalOpen(true)
              }}
              className="
              px-3 py-1 rounded-lg
              bg-blue-600 text-white text-sm
              cursor-pointer
              hover:bg-blue-700
              active:scale-95
              transition-all
            "
            >
              Agregar
            </button>
          </div>

          <div className="space-y-2">

            {equipo
              .filter(e => (e.posicion || 0) > 15)
              .map(p => (
                <div
                  key={p.sesion_asistenciaid}
                  className="
                    p-2 bg-gray-100 rounded-lg text-sm
                    flex justify-between items-center
                    hover:bg-gray-200
                    transition-all
                    "
                >
                  <div className="flex justify-between items-center w-full">

                    <div className="flex flex-col">
                      <span>
                        {p.persona?.apellido},
                        {' '}
                        {p.persona?.nombre}
                      </span>

                      <span className="text-gray-400 text-xs">
                        {p.persona?.posicion || '-'}
                      </span>
                    </div>

                    {lesionesActivas[p.personaid] && (
                      <img
                        src="/img/cruz_roja.png"
                        className="w-5 h-5"
                      />
                    )}

                    </div>

                  <button
                    onClick={() => quitar(p)}
                    className="
                    text-red-500
                    text-xs
                    cursor-pointer
                    hover:scale-110
                    active:scale-90
                    transition-all
                    "
                  >
                    ✕
                  </button>
                </div>
              ))}

          </div>
        </div>

      </div>

      {/* SIDEBAR */}
{modalOpen && (
  <div
    className="
      fixed inset-0 z-50
      bg-black/40
    "
    onClick={() => {
      setModalOpen(false)
      setModalPos(null)
    }}
  >

    <div
      onClick={(e) => e.stopPropagation()}
      className="
        absolute right-0 top-0
        h-full
        w-full lg:w-[420px]
        bg-white
        shadow-2xl
        flex flex-col
        animate-[slideIn_.2s_ease-out]
      "
    >

      {/* HEADER */}
      <div
        className="
          p-4 border-b
          flex items-center justify-between
        "
      >

        <div>
          <div className="font-bold text-lg">
            Seleccionar jugador
          </div>

          <div className="text-xs text-gray-500">
            Posición:
            {' '}
            {modalPos === 999
              ? 'SUPLENTE'
              : modalPos}
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            title="Actualizar jugadores"
            onClick={actualizarDesdePlantel}
            className="
              w-10 h-10
              rounded-xl
              flex items-center justify-center
              hover:bg-gray-100
              active:scale-90
              transition-all
              cursor-pointer
            "
          >
            <img
              src="/img/refresh.png"
              alt="refresh"
              className="w-6 h-6"
            />
          </button>

          <button
            onClick={() => {
              setModalOpen(false)
              setModalPos(null)
            }}
            className="
              w-10 h-10
              rounded-xl
              flex items-center justify-center
              hover:bg-gray-100
              active:scale-90
              transition-all
              cursor-pointer
              text-xl
            "
          >
            ✕
          </button>

        </div>

      </div>

      {/* FILTRO */}
      <div className="p-4 border-b">

        <input
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value)
          }
          placeholder="
            Buscar jugador o posición...
          "
          className="
            w-full
            p-3
            border
            rounded-2xl
            text-sm
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        />

      </div>

      {/* LISTADO */}
      <div
        className="
          flex-1 overflow-y-auto
          p-4 space-y-2
        "
      >

        {disponiblesFiltrados.map(p => (
          <button
            key={p.sesion_asistenciaid}
            onClick={async () => {

              if (modalPos === 999) {

                const suplentes = equipo.filter(
                  e => (e.posicion || 0) > 15
                )

                const siguientePos =
                  suplentes.length > 0
                    ? Math.max(
                        ...suplentes.map(
                          s => s.posicion || 16
                        )
                      ) + 1
                    : 16

                await asignar(
                  p,
                  siguientePos
                )

              } else {

                await asignar(
                  p,
                  modalPos!
                )

              }

              setModalOpen(false)
              setModalPos(null)
            }}
            className="
              w-full
              p-3
              rounded-2xl
              border
              bg-gray-50
              text-left

              hover:bg-gray-100
              active:scale-[0.98]

              transition-all
              cursor-pointer
            "
          >

<div className="flex items-center justify-between">

<div className="font-semibold">
  {p.persona?.apellido},
  {' '}
  {p.persona?.nombre}
</div>

{lesionesActivas[p.personaid] && (
  <img
    src="/img/cruz_roja.png"
    className="w-5 h-5"
  />
)}

</div>

            <div className="text-xs text-gray-500 mt-1">
              {p.persona?.posicion || '-'}
            </div>

          </button>
        ))}

      </div>

    </div>
  </div>
)}

    </div>
  )
}

// ---------------- UI ----------------

function Row({ children }: any) {
  return (
    <div className="flex justify-center gap-2">
      {children}
    </div>
  )
}

function Cell({
  pos,
  player,
  quitar,
  toggleCapitan,
  handleDoubleTapCapitan,
  setModalOpen,
  setModalPos,
  lesionesActivas
}: any) {

  const [clicks, setClicks] = useState(0)
  

  const timeoutRef = useRef<any>(null)

const handleCellClick = async () => {

  // DOBLE CLICK
  if (timeoutRef.current) {

    clearTimeout(timeoutRef.current)
    timeoutRef.current = null

    if (player) {
      await toggleCapitan(player)
    }

    return
  }

  // CLICK SIMPLE
  timeoutRef.current = setTimeout(() => {

    setModalPos(pos)
    setModalOpen(true)

    timeoutRef.current = null

  }, 220)
}

  return (
    <div
      onClick={handleCellClick}
      onTouchEnd={() => {
        if (player) {
          handleDoubleTapCapitan(player)
        }
      }}
      className="
        relative w-20 h-24
        bg-white/90 rounded-lg
        flex flex-col items-center justify-center
        text-[10px] shadow px-1
        cursor-pointer
      "
    >

      {Number(player?.capitan) === 1 && (
        <div className="absolute top-1 right-1 text-yellow-400 font-black text-lg leading-none">
          ©
        </div>
      )}

      {player &&
        lesionesActivas[player.personaid] && (
          <img
            src="/img/cruz_roja.png"
            className="
              absolute
              top-1
              left-1
              w-4
              h-4
            "
          />
      )}

      <div className="text-[9px] text-gray-500">
        {pos}
      </div>

      {player ? (
        <div className="text-center leading-tight">

          <div className="font-bold text-[11px]">
            {player.persona?.apellido}
          </div>

          <div className="text-[10px] text-gray-600">
            {player.persona?.nombre}
          </div>

        </div>
      ) : (
        <span className="text-gray-300 text-[10px]">
          vacío
        </span>
      )}

      {player && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            quitar(player)
          }}
          className="
            text-red-500
            text-[9px]
            cursor-pointer
            hover:scale-110
            active:scale-90
            transition-all
          "
        >
          ✕
        </button>
      )}

    </div>
  )
}
