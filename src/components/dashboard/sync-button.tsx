"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SyncButtonProps {
  accountId: string
  username: string
  platform: string
}

export function SyncButton({ accountId, username, platform }: SyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/refresh-account', {
        method: 'POST',
        body: JSON.stringify({ accountId, username, platform }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await res.json()

      if (res.ok) {
        if (data.processed > 0) {
            alert(`Sucesso! ${data.processed} vídeos atualizados.`)
        } else {
            alert(`Sincronização concluída, mas nenhum novo dado foi encontrado.`)
        }
        router.refresh()
      } else {
        console.error("Failed to sync", data.error)
        alert(`Erro ao sincronizar: ${data.error}`)
      }
    } catch (e) {
      console.error(e)
      alert("Erro inesperado ao conectar com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleSync} disabled={loading}>
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Sincronizando...' : 'Sincronizar'}
    </Button>
  )
}
