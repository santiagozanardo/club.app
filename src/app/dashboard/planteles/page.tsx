'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

export default function PlantelesPage() {
  const router = useRouter()

  const [planteles, setPlanteles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // MODAL
  const [mostrarModal, setMostrarModal] = useState(false)

  // FORM
  const [plantelEditando, setPlantelEditando] = useState<any | null>(null)
  const [categoria, setCategoria] = useState('')
  const [anio, setAnio] = useState('')

  const [clienteId, setClienteId] = useState<number | null>(null)

  // FILTROS
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    cargarPlanteles()
  }, [])

  // -------------------------
  // LOAD
  // -------------------------
  const cargarPlanteles = async () => {
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

    if (!profile?.clienteid) {
      setLoading(false)
      return
    }

    setClienteId(profile.clienteid)

    const { data } = await supabase
      .from('plantel')
      .select('*')
      .eq('clienteid', profile.clienteid)
      .order('anio', {
        ascending: false
      })

    setPlanteles(data ?? [])
    setLoading(false)
  }

  // -------------------------
  // CREAR / EDITAR
  // -------------------------
  const guardarPlantel = async () => {
    console.log('guardarPlantel')
  
    console.log({
      categoria,
      anio,
      clienteId,
      plantelEditando
    })
  
    if (!categoria) {
      alert('Ingresá categoría')
      return
    }
  
    if (!anio) {
      alert('Ingresá año')
      return
    }
  
    if (!clienteId && !plantelEditando) {
      alert('clienteId null')
      return
    }
  
    let error = null
  
    if (plantelEditando) {
      const res = await supabase
        .from('plantel')
        .update({
          categoria,
          anio
        })
        .eq(
          'plantelid',
          plantelEditando.plantelid
        )
  
      error = res.error
    } else {
      const res = await supabase
        .from('plantel')
        .insert({
          categoria,
          anio,
          clienteid: clienteId
        })
  
      error = res.error
    }
  
    console.log('ERROR', error)
  
    if (error) {
      alert(error.message)
      return
    }
  
    cerrarModal()
  
    await cargarPlanteles()
  }

  const editarPlantel = (
    p: any
  ) => {
    setPlantelEditando(p)

    setCategoria(p.categoria || '')
    setAnio(p.anio || '')

    setMostrarModal(true)
  }

  const eliminarPlantel = async (
    plantelid: number
  ) => {
    const ok = confirm(
      '¿Eliminar plantel?'
    )
  
    if (!ok) return
  
    // eliminar relaciones del plantel
    await supabase
      .from('plantel_persona')
      .delete()
      .eq('plantelid', plantelid)
  
    // buscar sesiones del plantel
    const { data: sesiones } =
      await supabase
        .from('sesion')
        .select('sesionid')
        .eq('plantelid', plantelid)
  
    const sesionIds =
      sesiones?.map(
        (s) => s.sesionid
      ) || []
  
    // eliminar asistencias
    if (sesionIds.length) {
      await supabase
        .from('sesion_asistencia')
        .delete()
        .in('sesionid', sesionIds)
  
      // eliminar equipos
      await supabase
        .from('sesion_equipo')
        .delete()
        .in('sesionid', sesionIds)
    }
  
    // eliminar sesiones
    await supabase
      .from('sesion')
      .delete()
      .eq('plantelid', plantelid)
  
    // eliminar plantel
    const { error } =
      await supabase
        .from('plantel')
        .delete()
        .eq('plantelid', plantelid)
  
    if (error) {
      alert(error.message)
      return
    }
  
    cargarPlanteles()
  }

  const cerrarModal = () => {
    setMostrarModal(false)

    setPlantelEditando(null)

    setCategoria('')
    setAnio('')
  }

  // -------------------------
  // FILTRO
  // -------------------------
  const plantelesFiltrados =
    useMemo(() => {
      return planteles.filter((p) => {
        const txt =
          `${p.categoria} ${p.anio}`.toLowerCase()

        return txt.includes(
          filtro.toLowerCase()
        )
      })
    }, [planteles, filtro])

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">

        <h1 className="text-3xl font-bold">
          Planteles
        </h1>

        <button
          onClick={() =>
            setMostrarModal(true)
          }
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
          +
        </button>

      </div>

      {/* FILTRO */}
      <div className="mb-6">
        <input
          placeholder="Buscar..."
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value)
          }
          className="
  w-full border rounded-xl p-3
  focus:ring-2 focus:ring-black/20
  transition-all
"
        />
      </div>

      {/* LISTADO */}
      {loading ? (
        <div>
          Cargando...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">

          {plantelesFiltrados.map((p) => (
            <div
              key={p.plantelid}
              onClick={() =>
                router.push(
                  `/dashboard/planteles/${p.plantelid}`
                )
              }
              className="
  bg-white rounded-2xl shadow p-5
  flex items-center justify-between
  hover:bg-gray-50 hover:shadow-md
  hover:scale-[1.01]
  active:scale-[0.99]
  transition-all
  cursor-pointer
"
            >

              <div>

                <div className="text-xl font-bold">
                  {p.categoria}
                </div>

                <div className="text-gray-500">
                  {p.anio}
                </div>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={(e) => {
                    e.stopPropagation()

                    editarPlantel(p)
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
                    className="w-6 h-6"
                  />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()

                    eliminarPlantel(
                      p.plantelid
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
                    className="w-6 h-6"
                  />
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* MODAL */}
      {mostrarModal && (
        <div className="
          fixed inset-0 z-50
          bg-black/50
          flex items-center justify-center
          p-4
        ">

          <div className="
            bg-white rounded-2xl
            p-6 w-full max-w-md
            space-y-4
          ">

            <h2 className="text-2xl font-bold">
              {plantelEditando
                ? 'Editar plantel'
                : 'Nuevo plantel'}
            </h2>

            <input
              value={categoria}
              onChange={(e) =>
                setCategoria(
                  e.target.value
                )
              }
              placeholder="Categoría"
              className="
  w-full border
  rounded-xl p-3
  focus:ring-2 focus:ring-black/20
  transition-all
"
            />

            <input
              value={anio}
              onChange={(e) =>
                setAnio(
                  e.target.value
                )
              }
              placeholder="Año"
              className="
  w-full border
  rounded-xl p-3
  focus:ring-2 focus:ring-black/20
  transition-all
"
            />

            <div className="flex gap-2 pt-2">

            <button
                type="button"
                onClick={guardarPlantel}
                className="
  flex-1 bg-black text-white
  py-3 rounded-xl
  cursor-pointer
  hover:opacity-90
  hover:scale-[1.02]
  active:scale-[0.98]
  transition-all
"
                >
                Guardar
                </button>

              <button
                type="button"
                onClick={cerrarModal}
                className="
  flex-1 border
  py-3 rounded-xl
  cursor-pointer
  hover:bg-gray-50
  hover:scale-[1.02]
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