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
      
      if (res.ok) {
        router.refresh()
      } else {
        console.error("Failed to sync")
        alert("Erro ao sincronizar. Verifique o console ou a API Key.")
      }
    } catch (e) {
      console.error(e)
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
