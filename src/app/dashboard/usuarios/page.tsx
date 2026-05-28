'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [mostrarModal, setMostrarModal] = useState(false)

  // -------------------------
  // FILTROS
  // -------------------------
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroApellido, setFiltroApellido] = useState('')
  const [filtroMail, setFiltroMail] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')

  // -------------------------
  // CREAR USUARIO (AGREGADO)
  // -------------------------
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [mail, setMail] = useState('')
  const [rol, setRol] = useState('')
  const [password, setPassword] = useState('')
  const [clienteNuevo, setClienteNuevo] = useState<number | null>(null)

  // -------------------------
  // ASOCIAR PLANTELES
  // -------------------------
const [usuarioPlantel, setUsuarioPlantel] = useState<any | null>(null)
const [planteles, setPlanteles] = useState<any[]>([])
const [plantelesAsignados, setPlantelesAsignados] = useState<any[]>([])
const [plantelSeleccionado, setPlantelSeleccionado] = useState<number | null>(null)
const [mostrarPlanteles, setMostrarPlanteles] = useState(false)

const abrirPlanteles = async (usuario: any) => {
  setUsuarioPlantel(usuario)
  setMostrarPlanteles(true)

	const clienteId = Number(usuario.clienteid)

	let query = supabase
	  .from('plantel')
	  .select('plantelid, clienteid, categoria, anio')

	if (usuario.clienteid) {
	  query = query.eq('clienteid', usuario.clienteid)
	} else {
	  setPlanteles([])
	  return
	}

	const { data: p, error } = await query

	console.log('PLANTELES:', p)
	console.log('ERROR:', error)

	setPlanteles(p ?? [])

  const { data: pu } = await supabase
    .from('plantel_usuario')
    .select('plantel_usuarioid, plantelid, usuario, plantel:plantelid(categoria, anio)')
    .eq('usuario', usuario.id)

  setPlantelesAsignados(pu ?? [])
}
const asignarPlantel = async () => {
  if (!usuarioPlantel || !plantelSeleccionado) return

  const { data, error } = await supabase
    .from('plantel_usuario')
    .insert({
      usuario: usuarioPlantel.id,
      plantelid: plantelSeleccionado
    })
    .select()

  if (error) {
    console.log('ERROR INSERT PLANTEL_USUARIO:', error)
    alert(error.message)
    return
  }

  console.log('INSERT OK:', data)

  setPlantelSeleccionado(null)
  abrirPlanteles(usuarioPlantel)
}
const eliminarPlantelUsuario = async (id: number) => {
  await supabase
    .from('plantel_usuario')
    .delete()
    .eq('plantel_usuarioid', id)

  abrirPlanteles(usuarioPlantel)
}

  // -------------------------
  // MODIFICAR USUARIO
  // -------------------------
  const [editandoId, setEditandoId] = useState<string | null>(null)
	const editarUsuario = (usuario: any) => {
	  setEditandoId(usuario.id)

	  setNombre(usuario.persona?.nombre || '')
	  setApellido(usuario.persona?.apellido || '')
	  setMail(usuario.persona?.mail || '')
	  setRol(usuario.persona?.rol || '')
	  setClienteNuevo(usuario.clienteid || null)

	  setMostrarModal(true)
	} 
	const guardarUsuario = async () => {
  // EDITAR
  if (editandoId) {
    await supabase
      .from('persona')
      .update({
        nombre,
        apellido,
        mail,
        rol
      })
      .eq('mail', mail)

    await supabase
      .from('profiles')
      .update({
        clienteid: clienteNuevo
      })
      .eq('id', editandoId)

  } else {
    // CREAR (tu lógica original)
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    const { data: persona } = await supabase
      .from('persona')
      .insert({
        nombre,
        apellido,
        mail,
        rol
      })
      .select()
      .single()

    await supabase.from('profiles').insert({
      id: data.user?.id,
      personaid: persona.personaid,
      clienteid: clienteNuevo
    })
  }

  limpiarFormulario()
  cargarUsuarios()
}
const borrarUsuario = async (id: string) => {
  const confirm = window.confirm('¿Seguro que querés borrar este usuario?')
  if (!confirm) return

  await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  cargarUsuarios()
}
const limpiarFormulario = () => {
  setNombre('')
  setApellido('')
  setMail('')
  setRol('')
  setPassword('')
  setClienteNuevo(null)
  setEditandoId(null)
  setMostrarModal(false)
}
  // -------------------------
  // PAGINACIÓN
  // -------------------------
  const [pagina, setPagina] = useState(1)
  const registrosPorPagina = 10

  // -------------------------
  // ORDENAMIENTO
  // -------------------------
  const [sortField, setSortField] = useState<string>('nombre')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    cargarUsuarios()
    cargarClientes()
  }, [])

  // -------------------------
  // DATA
  // -------------------------
  const cargarUsuarios = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        clienteid,
        personaid,
        persona:personaid (
          personaid,
          nombre,
          apellido,
          mail,
          rol
        )
      `)

    if (error) console.log(error)

    setUsuarios(data ?? [])
    setLoading(false)
  }

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('cliente')
      .select('clienteid, cliente')

    if (error) console.log(error)

    setClientes(data ?? [])
  }

  // -------------------------
  // UPDATE CLIENTE
  // -------------------------
  const actualizarCliente = async (userId: string, clienteid: number | null) => {
    await supabase
      .from('profiles')
      .update({ clienteid })
      .eq('id', userId)

    cargarUsuarios()
  }

  // -------------------------
  // ORDENAR
  // -------------------------
  const ordenar = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // -------------------------
  // CREAR USUARIO (AGREGADO)
  // -------------------------
  const crearUsuario = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    if (!data.user) return

    const { data: persona, error: perError } = await supabase
      .from('persona')
      .insert({
        nombre,
        apellido,
        mail,
        rol
      })
      .select()
      .single()

    if (perError) {
      alert(perError.message)
      return
    }

	await supabase.from('profiles').insert({
	  id: data.user.id,
	  personaid: persona.personaid,
	  clienteid: clienteNuevo
	})

    setMostrarModal(false)
    setNombre('')
    setApellido('')
    setMail('')
    setRol('')
    setPassword('')
	setClienteNuevo(null)

    cargarUsuarios()
  }

  // -------------------------
  // FILTRADO
  // -------------------------
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const nombre = u.persona?.nombre?.toLowerCase() || ''
      const apellido = u.persona?.apellido?.toLowerCase() || ''
      const mail = u.persona?.mail?.toLowerCase() || ''
      const rol = u.persona?.rol?.toLowerCase() || ''
      const cliente = clientes.find(c => c.clienteid === u.clienteid)?.cliente?.toLowerCase() || ''

      return (
        nombre.includes(filtroNombre.toLowerCase()) &&
        apellido.includes(filtroApellido.toLowerCase()) &&
        mail.includes(filtroMail.toLowerCase()) &&
        rol.includes(filtroRol.toLowerCase()) &&
        cliente.includes(filtroCliente.toLowerCase())
      )
    })
  }, [
    usuarios,
    filtroNombre,
    filtroApellido,
    filtroMail,
    filtroRol,
    filtroCliente,
    clientes
  ])

  // -------------------------
  // ORDENADO
  // -------------------------
  const usuariosOrdenados = useMemo(() => {
    const data = [...usuariosFiltrados]

    return data.sort((a, b) => {
      const getValue = (u: any) => {
        switch (sortField) {
          case 'nombre':
            return u.persona?.nombre || ''
          case 'apellido':
            return u.persona?.apellido || ''
          case 'mail':
            return u.persona?.mail || ''
          case 'rol':
            return u.persona?.rol || ''
          case 'cliente':
            return clientes.find(c => c.clienteid === u.clienteid)?.cliente || ''
          default:
            return ''
        }
      }

      const valA = getValue(a).toLowerCase()
      const valB = getValue(b).toLowerCase()

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [usuariosFiltrados, sortField, sortDirection, clientes])

  // -------------------------
  // PAGINADO
  // -------------------------
  const totalPaginas = Math.ceil(usuariosOrdenados.length / registrosPorPagina)

  const usuariosPaginados = useMemo(() => {
    const start = (pagina - 1) * registrosPorPagina
    return usuariosOrdenados.slice(start, start + registrosPorPagina)
  }, [usuariosOrdenados, pagina])

  const cambiarPagina = (nueva: number) => {
    if (nueva < 1 || nueva > totalPaginas) return
    setPagina(nueva)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      <div className="p-8">

        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <h1 className="text-3xl font-bold">Usuarios</h1>

          {/* AGREGADO */}
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-black text-white px-4 py-2 rounded"
          >
            +
          </button>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-5 gap-3 mb-6">

          <input
            placeholder="Nombre"
            className="border p-2 rounded"
            value={filtroNombre}
            onChange={(e) => { setFiltroNombre(e.target.value); setPagina(1) }}
          />

          <input
            placeholder="Apellido"
            className="border p-2 rounded"
            value={filtroApellido}
            onChange={(e) => { setFiltroApellido(e.target.value); setPagina(1) }}
          />

          <input
            placeholder="Mail"
            className="border p-2 rounded"
            value={filtroMail}
            onChange={(e) => { setFiltroMail(e.target.value); setPagina(1) }}
          />

          <input
            placeholder="Rol"
            className="border p-2 rounded"
            value={filtroRol}
            onChange={(e) => { setFiltroRol(e.target.value); setPagina(1) }}
          />

          <input
            placeholder="Cliente"
            className="border p-2 rounded"
            value={filtroCliente}
            onChange={(e) => { setFiltroCliente(e.target.value); setPagina(1) }}
          />

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {loading ? (
            <div className="p-6">Cargando...</div>
          ) : (
            <table className="w-full">

              <thead className="bg-gray-50 border-b">
                <tr>

                  <th className="p-4 text-left cursor-pointer" onClick={() => ordenar('nombre')}>
                    Nombre {sortField === 'nombre' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>

                  <th className="p-4 text-left cursor-pointer" onClick={() => ordenar('apellido')}>
                    Apellido {sortField === 'apellido' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>

                  <th className="p-4 text-left cursor-pointer" onClick={() => ordenar('mail')}>
                    Mail {sortField === 'mail' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>

                  <th className="p-4 text-left cursor-pointer" onClick={() => ordenar('rol')}>
                    Rol {sortField === 'rol' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>

                  <th className="p-4 text-left">
                    Cliente
                  </th>

				  <th className="p-4 text-left">
				    Acciones
				  </th>

                </tr>
              </thead>

              <tbody>
                {usuariosPaginados.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-gray-50">

                    <td className="p-4">{usuario.persona?.nombre}</td>
                    <td className="p-4">{usuario.persona?.apellido}</td>
                    <td className="p-4">{usuario.persona?.mail}</td>
                    <td className="p-4">{usuario.persona?.rol}</td>
					<td className="p-4">{clientes.find(c => c.clienteid === usuario.clienteid)?.cliente || ''}</td>
					<td className="p-4 flex gap-2">
					  <button
						className="px-3 py-1 border rounded"
						onClick={() => editarUsuario(usuario)}
					  >
						Editar
					  </button>

					  <button
						className="px-3 py-1 border rounded text-red-500"
						onClick={() => borrarUsuario(usuario.id)}
					  >
						Borrar
					  </button>
					  <button
					    className="px-3 py-1 border rounded"
					    onClick={() => abrirPlanteles(usuario)}
					  >
					    Ver planteles asignados
					  </button>
					</td>
                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </div>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between mt-4">

          <button
            onClick={() => cambiarPagina(pagina - 1)}
            disabled={pagina === 1}
            className="px-4 py-2 border rounded"
          >
            Anterior
          </button>

			<div className="text-center">
			  <div>
				Página <strong>{pagina}</strong> de <strong>{totalPaginas || 1}</strong>
			  </div>

			  <div className="text-sm text-gray-600 mt-1">
				Se muestran {usuariosPaginados.length} registros de {usuariosOrdenados.length}
			  </div>
			</div>

          <button
            onClick={() => cambiarPagina(pagina + 1)}
            disabled={pagina === totalPaginas}
            className="px-4 py-2 border rounded"
          >
            Siguiente
          </button>

        </div>

        {/* MODAL AGREGADO */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 space-y-3">

              <input
                placeholder="Nombre"
                className="border p-2 w-full"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />

              <input
                placeholder="Apellido"
                className="border p-2 w-full"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />

              <input
                placeholder="Mail"
                className="border p-2 w-full"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
              />

                <select
                className="border p-2 rounded w-full"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                >
                <option value="">Seleccionar rol</option>

                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                <option value="JUGADOR">JUGADOR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ENTRENADOR">ENTRENADOR</option>
                <option value="HC">HC</option>
                <option value="KINE">KINE</option>
                <option value="PF">PF</option>
                <option value="NUTRICIONISTA">NUTRICIONISTA</option>
                <option value="ANALISTA">ANALISTA</option>
                <option value="MEDICO">MEDICO</option>
                </select>
			  
				<select
				  className="border p-2 w-full"
				  value={clienteNuevo || ''}
				  onChange={(e) =>
					setClienteNuevo(e.target.value ? Number(e.target.value) : null)
				  }
				>
				  <option value="">Seleccionar Cliente</option>

				  {clientes.map((c) => (
					<option key={c.clienteid} value={c.clienteid}>
					  {c.cliente}
					</option>
				  ))}
				</select>

              <input
                type="password"
                placeholder="Password"
                className="border p-2 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  className="bg-black text-white px-4 py-2 w-full"
                  onClick={guardarUsuario}
                >
                  Crear/Actualizar
                </button>

                <button
                  className="border px-4 py-2 w-full"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        )}
		{mostrarPlanteles && (
		  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">

			  <h2 className="text-xl font-bold">
				Asignar planteles a {usuarioPlantel?.persona?.nombre}
			  </h2>

			  {/* SELECT PLANTELES */}
			  <div className="flex gap-2">
				<select
				  className="border p-2 flex-1"
				  value={plantelSeleccionado || ''}
				  onChange={(e) =>
					setPlantelSeleccionado(
					  e.target.value ? Number(e.target.value) : null
					)
				  }
				>
				  <option value="">Seleccionar plantel</option>

				  {planteles.map((p) => (
					<option key={p.plantelid} value={p.plantelid}>
					  {`${p.categoria} - ${p.anio}`}
					</option>
				  ))}
				</select>

				<button
				  className="border px-4"
				  onClick={asignarPlantel}
				>
				  Agregar
				</button>
			  </div>

			  {/* LISTA ASIGNADOS */}
				<div className="border rounded overflow-hidden">

				  <table className="w-full text-sm">
					<thead className="bg-gray-100">
					  <tr>
						<th className="text-left p-2">Plantel</th>
						<th className="text-left p-2">Acciones</th>
					  </tr>
					</thead>

					<tbody>
					  {plantelesAsignados.map((p) => (
						<tr key={p.plantel_usuarioid} className="border-t">

						  <td className="p-2">
							{p.plantel?.categoria} - {p.plantel?.anio}
						  </td>

						  <td className="p-2">
							<button
							  className="text-red-500 hover:underline"
							  onClick={() => eliminarPlantelUsuario(p.plantel_usuarioid)}
							>
							  Eliminar
							</button>
						  </td>

						</tr>
					  ))}

					  {plantelesAsignados.length === 0 && (
						<tr>
						  <td className="p-2 text-gray-500" colSpan={2}>
							Sin planteles asignados
						  </td>
						</tr>
					  )}
					</tbody>
				  </table>

				</div>

			  <button
				className="w-full border py-2 rounded"
				onClick={() => setMostrarPlanteles(false)}
			  >
				Cerrar
			  </button>

			</div>
		  </div>
		)}

      </div>
    </div>
  )
}