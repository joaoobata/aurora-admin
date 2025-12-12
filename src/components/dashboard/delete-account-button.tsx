"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteAccount } from "@/app/dashboard/actions"
import { useState } from "react"

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover esta conta? Todo histórico será perdido.")) return;

    setLoading(true)
    await deleteAccount(accountId)
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
