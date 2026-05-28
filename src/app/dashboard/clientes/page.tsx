'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // MODAL
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const [cliente, setCliente] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [subiendo, setSubiendo] = useState(false)

  // -------------------------
  // LOAD
  // -------------------------
  const cargarClientes = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('cliente')
      .select(`
        clienteid,
        cliente,
        descripcion,
        logourl
      `)
      .order('cliente', {
        ascending: true
      })

    if (error) {
      console.log(error)
    }

    setClientes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  // -------------------------
  // SUBIR LOGO
  // -------------------------
  const subirLogo = async () => {
    if (!logoFile) return null

    const ext =
      logoFile.name
        .split('.')
        .pop()

    const filePath =
      `cliente/${Date.now()}-${Math.random()}.${ext}`

    const { error } = await supabase
      .storage
      .from('logos')
      .upload(
        filePath,
        logoFile,
        {
          upsert: true
        }
      )

    if (error) {
      throw error
    }

    const {
      data: publicUrlData
    } = supabase
      .storage
      .from('logos')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  // -------------------------
  // CREATE / UPDATE
  // -------------------------
  const guardarCliente = async () => {
    if (!cliente.trim()) return

    try {
      setSubiendo(true)

      let logoUrl: string | null = null

      if (logoFile) {
        logoUrl = await subirLogo()
      }

      if (editId) {

        const payload: any = {
          cliente,
          descripcion
        }

        if (logoUrl) {
          payload.logourl = logoUrl
        }

        const { error } = await supabase
          .from('cliente')
          .update(payload)
          .eq('clienteid', editId)

        if (error) {
          alert(error.message)
          return
        }

      } else {

        const { error } = await supabase
          .from('cliente')
          .insert({
            cliente,
            descripcion,
            logourl: logoUrl
          })

        if (error) {
          alert(error.message)
          return
        }

      }

      limpiarForm()
      cargarClientes()

    } catch (err: any) {

      console.log(err)

      alert(
        err?.message ||
        'Error subiendo logo'
      )

    } finally {
      setSubiendo(false)
    }
  }

  // -------------------------
  // DELETE
  // -------------------------
  const eliminarCliente = async (
    id: number
  ) => {

    const confirmar = confirm(
      '¿Eliminar cliente?'
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('cliente')
      .delete()
      .eq('clienteid', id)

    if (error) {
      alert(error.message)
      return
    }

    cargarClientes()
  }

  // -------------------------
  // EDIT
  // -------------------------
  const abrirEditar = (c: any) => {

    setEditId(c.clienteid)

    setCliente(c.cliente)

    setDescripcion(
      c.descripcion || ''
    )

    setLogoFile(null)

    setMostrarModal(true)
  }

  // -------------------------
  // RESET
  // -------------------------
  const limpiarForm = () => {

    setEditId(null)

    setCliente('')

    setDescripcion('')

    setLogoFile(null)

    setMostrarModal(false)
  }

  return (

    <div className="flex min-h-screen bg-gray-100">

      <div className="p-8 w-full">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-bold">
            Clientes
          </h1>

          <button
            onClick={() =>
              setMostrarModal(true)
            }
            className="
              bg-black text-white
              px-4 py-3 rounded-xl
              cursor-pointer
              hover:scale-105
              active:scale-95
              transition-all
            "
          >
            +
          </button>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {loading ? (

            <div className="p-6">
              Cargando clientes...
            </div>

          ) : (

            <table className="w-full">

              <thead className="bg-gray-50 border-b">

                <tr>

                  <th className="p-4 text-left">
                    Logo
                  </th>

                  <th className="p-4 text-left">
                    Cliente
                  </th>

                  <th className="p-4 text-left">
                    Descripción
                  </th>

                  <th className="p-4 text-left">
                    Acciones
                  </th>

                </tr>

              </thead>

              <tbody>

                {clientes.map((c) => (

                  <tr
                    key={c.clienteid}
                    className="
                      border-b
                      hover:bg-gray-50
                    "
                  >

                    <td className="p-4">

                      {c.logourl ? (

                        <img
                          src={c.logourl}
                          alt="logo"
                          className="
                            w-14 h-14
                            object-contain
                            rounded-xl
                            border
                            bg-white
                          "
                        />

                      ) : (

                        <div
                          className="
                            w-14 h-14
                            rounded-xl
                            border
                            bg-gray-100
                          "
                        />

                      )}

                    </td>

                    <td className="p-4 font-medium">
                      {c.cliente}
                    </td>

                    <td className="p-4 text-gray-600">
                      {c.descripcion}
                    </td>

                    <td className="p-4 flex gap-3">

                      <button
                        onClick={() =>
                          abrirEditar(c)
                        }
                        className="
                          px-3 py-1 border rounded-xl
                          cursor-pointer
                          hover:scale-105
                          active:scale-95
                          transition-all
                        "
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          eliminarCliente(
                            c.clienteid
                          )
                        }
                        className="
                          px-3 py-1 border rounded-xl
                          text-red-600
                          cursor-pointer
                          hover:scale-105
                          active:scale-95
                          transition-all
                        "
                      >
                        Borrar
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
              fixed inset-0
              bg-black/50
              flex items-center justify-center
              p-4 z-50
            "
          >

            <div
              className="
                bg-white
                rounded-2xl
                w-full max-w-md
                p-6
                space-y-4
              "
            >

              <h2 className="text-2xl font-bold">

                {editId
                  ? 'Editar cliente'
                  : 'Nuevo cliente'}

              </h2>

              <input
                type="text"
                placeholder="Cliente"
                value={cliente}
                onChange={(e) =>
                  setCliente(
                    e.target.value
                  )
                }
                className="
                  w-full border
                  rounded-xl
                  px-4 py-3
                "
              />

              <textarea
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(
                    e.target.value
                  )
                }
                className="
                  w-full border
                  rounded-xl
                  px-4 py-3
                "
              />

              <div>

                <div className="text-sm font-medium mb-2">
                  Logo
                </div>

                <input
                  type="file"
                  accept="
                    image/png,
                    image/jpeg,
                    image/webp
                  "
                  onChange={(e) =>
                    setLogoFile(
                      e.target.files?.[0] ||
                      null
                    )
                  }
                  className="
                    w-full border
                    rounded-xl
                    px-3 py-2
                    cursor-pointer
                  "
                />

              </div>

              <div className="flex gap-3 pt-2">

                <button
                  onClick={limpiarForm}
                  className="
                    flex-1 border
                    py-3 rounded-xl
                    cursor-pointer
                    hover:scale-[1.02]
                    active:scale-95
                    transition-all
                  "
                >
                  Cancelar
                </button>

                <button
                  onClick={guardarCliente}
                  disabled={subiendo}
                  className="
                    flex-1
                    bg-black text-white
                    py-3 rounded-xl
                    cursor-pointer
                    hover:scale-[1.02]
                    active:scale-95
                    transition-all
                    disabled:opacity-50
                  "
                >

                  {subiendo
                    ? 'Subiendo...'
                    : editId
                      ? 'Actualizar'
                      : 'Crear'}

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}