'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

import { supabase } from '@/src/lib/supabase'

type ClienteType = {
  clienteid: number | null
  cliente: string | null
  logourl: string | null
}

type ClienteContextType = {
  clienteData: ClienteType | null
  loadingCliente: boolean
  recargarCliente: () => Promise<void>
}

const ClienteContext =
  createContext<ClienteContextType>({
    clienteData: null,
    loadingCliente: true,
    recargarCliente: async () => {}
  })

export function ClienteProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [clienteData, setClienteData] =
    useState<ClienteType | null>(null)

  const [loadingCliente, setLoadingCliente] =
    useState(true)

  const cargarCliente = async () => {
    setLoadingCliente(true)

    // usuario logueado
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setLoadingCliente(false)
      return
    }

    // buscar usuario
    const { data: usuario } = await supabase
      .from('usuario')
      .select('clienteid')
      .eq('usuariouuid', user.id)
      .single()

    if (!usuario?.clienteid) {
      setLoadingCliente(false)
      return
    }

    // buscar cliente
    const { data: cliente } = await supabase
      .from('cliente')
      .select(`
        clienteid,
        cliente,
        logourl
      `)
      .eq('clienteid', usuario.clienteid)
      .single()

    setClienteData(cliente)

    setLoadingCliente(false)
  }

  useEffect(() => {
    cargarCliente()
  }, [])

  return (
    <ClienteContext.Provider
      value={{
        clienteData,
        loadingCliente,
        recargarCliente: cargarCliente
      }}
    >
      {children}
    </ClienteContext.Provider>
  )
}

export function useCliente() {
  return useContext(ClienteContext)
}