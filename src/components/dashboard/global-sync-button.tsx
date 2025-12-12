"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function GlobalSyncButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSyncAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/refresh-account', {
        method: 'POST',
        body: JSON.stringify({}), // Empty body triggers batch mode
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await res.json()

      if (res.ok) {
        alert(`Sincronização global concluída! ${data.processed} contas processadas com sucesso.`)
        router.refresh()
      } else {
        console.error("Failed to sync", data.error)
        alert(`Erro ao sincronizar tudo: ${data.message || data.error}`)
      }
    } catch (e) {
      console.error(e)
      alert("Erro inesperado ao conectar com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="default" className="gap-2" onClick={handleSyncAll} disabled={loading}>
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Atualizando Tudo...' : 'Sincronizar Tudo'}
    </Button>
  )
}
