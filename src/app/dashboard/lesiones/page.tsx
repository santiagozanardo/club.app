'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

const ESTADOS = [
  'ACTIVA',
  'ALTA'
]

const TIPOS_LESION = [
  'DESGARRO',
  'ESGUINCE',
  'DISTENSION',
  'FRACTURA',
  'LUXACION',
  'CONTUSION',
  'GOLPE',
  'CONMOCION',
  'CERVICAL',
  'HOMBRO',
  'RODILLA',
  'TOBILLO',
  'ISQUIOS',
  'ADUCTOR',
  'GEMELO',
  'OTRA'
]

export default function LesionesPage() {

  const [loading, setLoading] =
    useState(true)

  const [clienteUsuario, setClienteUsuario] =
    useState<number | null>(null)

  const [lesiones, setLesiones] =
    useState<any[]>([])

  const [personas, setPersonas] =
    useState<any[]>([])

  const [sesiones, setSesiones] =
    useState<any[]>([])

  const [mostrarModal, setMostrarModal] =
    useState(false)

  const [filtro, setFiltro] =
    useState('')

  const [filtroEstado, setFiltroEstado] =
    useState('')

  const [lesionid, setLesionid] =
    useState<number | null>(null)

  const [personaid, setPersonaid] =
    useState<number | null>(null)

  const [sesionid, setSesionid] =
    useState<number | null>(null)

  const [descripcion, setDescripcion] =
    useState('')

  const [tipo, setTipo] =
    useState('')

  const [fechaLesion, setFechaLesion] =
    useState('')



  const [fechaAltaEst, setFechaAltaEst] =
    useState('')

  const [fechaAlta, setFechaAlta] =
    useState('')

  const [puedeJugar, setPuedeJugar] =
    useState(false)

  const [estado, setEstado] =
    useState('ACTIVA')

  const inputClass = (value: string) => `
    border rounded-2xl p-3 text-sm
    transition-all
    focus:outline-none
    focus:ring-2 focus:ring-black/20
    hover:border-black
    ${!value ? 'text-gray-400' : 'text-black'}
  `

  useEffect(() => {
    inicializar()
  }, [])

  

  const inicializar = async () => {

    setLoading(true)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } =
      await supabase
        .from('profiles')
        .select('clienteid')
        .eq('id', user.id)
        .single()

    const clienteid =
      profile?.clienteid || null

    setClienteUsuario(clienteid)

    await Promise.all([
      cargarLesiones(clienteid),
      cargarPersonas(clienteid),
      cargarSesiones(clienteid)
    ])

    setLoading(false)
  }

  
  const cargarLesiones = async (
    clienteid: number | null
  ) => {

    const { data } =
      await supabase
        .from('lesion')
        .select(`
          *,
          persona (
            personaid,
            nombre,
            apellido
          ),
          sesion (
            sesionid,
            fecha,
            club
          )
        `)
        .order(
          'fecha_lesion',
          { ascending: false }
        )

    setLesiones(data ?? [])
  }

  const cargarPersonas = async (
    clienteid: number | null
  ) => {
  
    const { data: plantelesUsuario } =
      await supabase
        .from('plantel_usuario')
        .select('plantelid')
        .eq('usuario', (
          await supabase.auth.getUser()
        ).data.user?.id)
  
    const idsPlanteles =
      (plantelesUsuario ?? []).map(
        (x) => x.plantelid
      )
  
    const { data: relaciones } =
      await supabase
        .from('plantel_persona')
        .select('personaid')
        .in(
          'plantelid',
          idsPlanteles.length > 0
            ? idsPlanteles
            : [-1]
        )
  
    const idsPersonas =
      (relaciones ?? []).map(
        (x) => x.personaid
      )
      if (idsPersonas.length === 0) {
        setPersonas([])
        return
      }

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
  
    if (idsPersonas.length > 0) {
      query = query.in(
        'personaid',
        idsPersonas
      )
    }
  
    const { data } = await query
  
    setPersonas(data ?? [])
  }

  const cargarSesiones = async (
    clienteid: number | null
  ) => {
  
    const { data: plantelesUsuario } =
      await supabase
        .from('plantel_usuario')
        .select('plantelid')
        .eq('usuario', (
          await supabase.auth.getUser()
        ).data.user?.id)
  
    const idsPlanteles =
      (plantelesUsuario ?? []).map(
        (x) => x.plantelid
      )
      if (idsPlanteles.length === 0) {
        setSesiones([])
        return
      }
  
    let query = supabase
      .from('sesion')
      .select(`
        *,
        plantel (
          categoria,
          anio
        )
      `)
      .order('fecha', {
        ascending: false
      })
  
    if (clienteid) {
      query = query.eq(
        'clienteid',
        clienteid
      )
    }
  
    if (idsPlanteles.length > 0) {
      query = query.in(
        'plantelid',
        idsPlanteles
      )
    }
  
    const { data } = await query
  
    setSesiones(data ?? [])
  }

  const abrirNuevo = () => {

    setLesionid(null)

    setPersonaid(null)
    setSesionid(null)

    setDescripcion('')
    setTipo('')

    setFechaLesion(
      new Date()
        .toISOString()
        .split('T')[0]
    )

    setFechaAltaEst('')
    setFechaAlta('')

    setPuedeJugar(false)

    setEstado('ACTIVA')

    setMostrarModal(true)
  }

  const abrirEditar = (
    lesion: any
  ) => {

    setLesionid(
      lesion.lesionid
    )

    setPersonaid(
      lesion.personaid
    )

    setSesionid(
      lesion.sesionid
    )

    setDescripcion(
      lesion.descripcion || ''
    )

    setTipo(
      lesion.tipo || ''
    )

    setFechaLesion(
      lesion.fecha_lesion || ''
    )

    setFechaAltaEst(
      lesion.fecha_alta_est || ''
    )

    setFechaAlta(
      lesion.fecha_alta || ''
    )

    setPuedeJugar(
      lesion.puede_jugar || false
    )

    setEstado(
      lesion.estado || 'ACTIVA'
    )

    setMostrarModal(true)
  }

  const cerrarModal = () => {

    setLesionid(null)

    setPersonaid(null)
    setSesionid(null)

    setDescripcion('')
    setTipo('')

    setFechaLesion('')
    setFechaAltaEst('')
    setFechaAlta('')

    setPuedeJugar(false)

    setEstado('ACTIVA')

    setMostrarModal(false)
  }

  const guardarLesion = async () => {

    if (
        !personaid ||
        !descripcion
      ) {
        alert(
          'Jugador y descripción son obligatorios'
        )
        return
      }
      
      if (
        estado === 'ALTA' &&
        !fechaAlta
      ) {
        alert(
          'Debe completar la fecha de alta médica'
        )
        return
      }

    const payload = {

      personaid,

      sesionid,

      descripcion,

      tipo,

      fecha_lesion:
        fechaLesion || null,

      fecha_alta_est:
        fechaAltaEst || null,

      fecha_alta:
        fechaAlta || null,

      puede_jugar:
        puedeJugar,

      estado
    }

    if (lesionid) {

      await supabase
        .from('lesion')
        .update(payload)
        .eq(
          'lesionid',
          lesionid
        )

    } else {

      await supabase
        .from('lesion')
        .insert(payload)

    }

    cerrarModal()

    await cargarLesiones(
      clienteUsuario
    )
  }

  const borrarLesion = async (
    id: number
  ) => {

    const ok = confirm(
      '¿Eliminar lesión?'
    )

    if (!ok) return

    await supabase
      .from('lesion')
      .delete()
      .eq(
        'lesionid',
        id
      )

    await cargarLesiones(
      clienteUsuario
    )
  }

  const darAlta = async () => {

    const hoy =
      new Date()
        .toISOString()
        .split('T')[0]

    setFechaAlta(hoy)

    setEstado('ALTA')

    setPuedeJugar(true)
  }

  const formatearFecha = (
    fecha: string
  ) => {
  
    if (!fecha) return '-'
  
    const [anio, mes, dia] =
      fecha.split('-')
  
    return `${dia}/${mes}/${anio}`
  }

  const lesionesFiltradas =
    useMemo(() => {

      return lesiones.filter(
        (l) => {

          const texto =
            `
            ${l.descripcion}
            ${l.tipo}
            ${l.persona?.apellido}
            ${l.persona?.nombre}
            ${l.estado}
          `
              .toLowerCase()

          const cumpleTexto =
            texto.includes(
              filtro.toLowerCase()
            )

          const cumpleEstado =
            !filtroEstado ||
            l.estado === filtroEstado

          return (
            cumpleTexto &&
            cumpleEstado
          )
        }
      )
    }, [
      lesiones,
      filtro,
      filtroEstado
    ])

  return (
    <div className="p-3 md:p-8 bg-gray-100 min-h-screen">

    <div className="flex items-center justify-between mb-4 md:mb-6">

    <h1 className="text-2xl md:text-3xl font-bold">
      Lesiones
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

  <div className="grid md:grid-cols-2 gap-3 mb-5">

    <input
      placeholder="Buscar..."
      value={filtro}
      onChange={(e) =>
        setFiltro(
          e.target.value
        )
      }
      className="
        w-full border
        rounded-xl p-3
        bg-white
      "
    />

    <select
      value={filtroEstado}
      onChange={(e) =>
        setFiltroEstado(
          e.target.value
        )
      }
      className="
        border rounded-xl p-3
        bg-white
      "
    >
      <option value="">
        Todos los estados
      </option>

      {ESTADOS.map((e) => (
        <option
          key={e}
          value={e}
        >
          {e}
        </option>
      ))}
    </select>

  </div>

  {/* MOBILE */}

  <div className="md:hidden space-y-3">

    {lesionesFiltradas.map(
      (l) => (

        <div
          key={l.lesionid}
          onClick={() =>
            abrirEditar(l)
          }
          className={`
  rounded-2xl
  p-4 shadow
  cursor-pointer
  transition-all
  hover:scale-[1.01]

  ${
    l.estado === 'ACTIVA'
      ? 'bg-red-50 border border-red-300'
      : 'bg-green-50 border border-green-300'
  }
`}
        >

            <div className="flex justify-between items-start">

            <div>
              <div className="font-bold">
                {
                  l.persona
                    ?.apellido
                },{' '}
                {
                  l.persona
                    ?.nombre
                }
              </div>

              <div className="text-sm text-gray-500">
                {l.tipo}
              </div>

            </div>

            <button
              onClick={(
                e
              ) => {

                e.stopPropagation()

                borrarLesion(
                  l.lesionid
                )
              }}
              className="
  cursor-pointer
  hover:scale-110
  transition-all
"
            >
              <img
                src="/img/delete.png"
                className="w-5 h-5"
              />
            </button>

          </div>

          <div className="mt-3 text-sm">
            {
              l.descripcion
            }
          </div>

          <div className="mt-3 flex justify-between items-end">

  <div>

    <div className="text-xs text-gray-500">
      Lesión:{' '}
      {formatearFecha(
        l.fecha_lesion
      )}
    </div>

    <div className="text-xs text-gray-500">

  {l.estado === 'ALTA'
    ? 'Alta médica: '
    : 'Alta estimada: '}

  {formatearFecha(
    l.estado === 'ALTA'
      ? l.fecha_alta
      : l.fecha_alta_est
  )}

</div>

  </div>

  <div
  className={`
    rounded-full p-1
    ${
      l.estado === 'ALTA'
        ? 'bg-green-200'
        : 'bg-red-100'
    }
  `}
>
  <img
    src={
      l.estado === 'ALTA'
        ? '/img/cruz_verde.png'
        : '/img/cruz_roja.png'
    }
    className="w-8 h-8"
  />
</div>

</div>

          

        </div>
      )
    )}

  </div>

  {/* DESKTOP */}

<div className="hidden md:block">

<div className="overflow-hidden rounded-2xl shadow bg-white">

  <table className="w-full">

    <thead className="bg-gray-100 border-b">

      <tr>

        <th className="text-left p-4">
          Estado
        </th>

        <th className="text-left p-4">
          Jugador
        </th>

        <th className="text-left p-4">
          Tipo
        </th>

        <th className="text-left p-4">
          Descripción
        </th>

        <th className="text-left p-4">
          Fecha lesión
        </th>

        <th className="text-left p-4">
  Alta
</th>

        <th className="w-16" />

      </tr>

    </thead>

    <tbody>

      {lesionesFiltradas.map((l) => (

        <tr
          key={l.lesionid}
          onClick={() => abrirEditar(l)}
          className={`
            cursor-pointer
            transition-all
            hover:brightness-95
            border-b

            ${
              l.estado === 'ALTA'
                ? 'bg-green-50'
                : 'bg-red-50'
            }
          `}
        >

          <td className="p-4">

            <div
              className={`
                inline-flex
                rounded-full
                p-1

                ${
                  l.estado === 'ALTA'
                    ? 'bg-green-300'
                    : 'bg-red-100'
                }
              `}
            >
              <img
                src={
                  l.estado === 'ALTA'
                    ? '/img/cruz_verde.png'
                    : '/img/cruz_roja.png'
                }
                className="w-8 h-8"
              />
            </div>

          </td>

          <td className="p-4 font-semibold">

            {l.persona?.apellido},{' '}
            {l.persona?.nombre}

          </td>

          <td className="p-4">
            {l.tipo}
          </td>

          <td className="p-4">
            {l.descripcion}
          </td>

          <td className="p-4">
            {formatearFecha(
              l.fecha_lesion
            )}
          </td>

          <td className="p-4">

  {formatearFecha(
    l.estado === 'ALTA'
      ? l.fecha_alta
      : l.fecha_alta_est
  )}

</td>

          <td className="p-4">

            <button
              onClick={(e) => {
                e.stopPropagation()
                borrarLesion(l.lesionid)
              }}
              className="
                cursor-pointer
                hover:scale-110
                active:scale-95
                transition-all
              "
            >
              <img
                src="/img/delete.png"
                className="w-5 h-5"
              />
            </button>

          </td>

        </tr>

      ))}

    </tbody>

  </table>

</div>

</div>

  {mostrarModal && (

    <div className="
      fixed inset-0 z-50
      bg-black/60
      flex items-end md:items-center
      justify-center
    ">

      <div className="
        bg-white
        w-full
        h-[100dvh]
        md:h-auto
        md:max-h-[90vh]
        md:max-w-4xl
        md:rounded-3xl
        overflow-y-auto
      ">

        <div className="
          sticky top-0
          bg-white border-b
          p-4
          flex justify-between
        ">

          <div>

            <div className="text-xl font-bold">

              {lesionid
                ? 'Editar lesión'
                : 'Nueva lesión'}

            </div>

          </div>

          <button
            onClick={
              cerrarModal
            }
            className="
  text-xl
  cursor-pointer
  hover:scale-110
  transition-all
"
          >
            ×
          </button>

        </div>



        <div className="p-4">

  <div className="grid md:grid-cols-2 gap-6">

    {/* COLUMNA IZQUIERDA */}
    <div className="space-y-4">

      <div>

        <div
          onClick={() =>
            setEstado(
              estado === 'ACTIVA'
                ? 'ALTA'
                : 'ACTIVA'
            )
          }
          className={`
            w-16 h-9 rounded-full
            flex items-center
            px-1
            cursor-pointer
            transition-all

            ${
              estado === 'ACTIVA'
                ? 'bg-red-500 justify-end'
                : 'bg-green-500 justify-start'
            }
          `}
        >
          <div
            className="
              w-7 h-7
              bg-white
              rounded-full
              shadow
            "
          />
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {estado === 'ACTIVA'
            ? 'Lesionado'
            : 'Alta médica'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Jugador
        </label>

        <select
          value={personaid || ''}
          onChange={(e) =>
            setPersonaid(
              Number(e.target.value)
            )
          }
          className="
            border rounded-2xl p-3
            w-full
          "
        >
          <option value="">
            Seleccionar jugador
          </option>

          {personas.map((p) => (
            <option
              key={p.personaid}
              value={p.personaid}
            >
              {p.apellido}, {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Sesión origen
        </label>

        <select
          value={sesionid || ''}
          onChange={(e) =>
            setSesionid(
              Number(e.target.value)
            )
          }
          className="
            border rounded-2xl p-3
            w-full
          "
        >
          <option value="">
            Seleccionar sesión
          </option>

          {sesiones.map((s) => (
            <option
              key={s.sesionid}
              value={s.sesionid}
            >
              {s.tipo}
              {' / '}
              {s.plantel?.categoria}
              {'-'}
              {s.plantel?.anio}
              {' / '}
              {formatearFecha(s.fecha)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Tipo de lesión
        </label>

        <select
          value={tipo}
          onChange={(e) =>
            setTipo(e.target.value)
          }
          className={inputClass(tipo)}
        >
          <option value="">
            Seleccionar tipo
          </option>

          {TIPOS_LESION.map((t) => (
            <option key={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Descripción
        </label>

        <textarea
          value={descripcion}
          onChange={(e) =>
            setDescripcion(
              e.target.value
            )
          }
          className="
            border rounded-2xl p-3
            w-full
          "
          rows={5}
        />
      </div>

    </div>

    {/* COLUMNA DERECHA */}
    <div className="space-y-4">

      <div>
        <label className="block text-sm font-semibold mb-1">
          Fecha lesión
        </label>

        <input
          type="date"
          value={fechaLesion}
          onChange={(e) =>
            setFechaLesion(
              e.target.value
            )
          }
          className="
            border rounded-2xl p-3
            w-full
          "
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Fecha estimada de alta
        </label>

        <input
          type="date"
          value={fechaAltaEst}
          onChange={(e) =>
            setFechaAltaEst(
              e.target.value
            )
          }
          className="
            border rounded-2xl p-3
            w-full
          "
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
  Fecha de alta médica
  {estado === 'ALTA' && ' *'}
</label>

        <input
  type="date"
  value={fechaAlta}
  required={estado === 'ALTA'}
  onChange={(e) =>
    setFechaAlta(
      e.target.value
    )
  }
  className="
    border rounded-2xl p-3
    w-full
  "
/>
      </div>

    </div>

  </div>

</div>

        <div className="
          sticky bottom-0
          bg-white border-t
          p-4 flex gap-2
        ">

          <button
            onClick={
              guardarLesion
            }
            className="
  flex-1
  bg-black text-white
  py-3 rounded-2xl
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
            onClick={
              cerrarModal
            }
            className="
  flex-1 border
  py-3 rounded-2xl
  cursor-pointer
  hover:bg-gray-100
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
