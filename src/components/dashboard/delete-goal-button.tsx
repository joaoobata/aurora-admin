"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteGoal } from "@/app/dashboard/actions"
import { useState } from "react"

export function DeleteGoalButton({ goalId }: { goalId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Remover esta meta?")) return;

    setLoading(true)
    await deleteGoal(goalId)
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
