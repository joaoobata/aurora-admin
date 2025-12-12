"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { createGoal } from "@/app/dashboard/actions"
import { Account } from "@/types"

export function AddGoalDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const result = await createGoal(formData)
    
    setLoading(false)
    if (result?.error) {
        alert(result.error)
    } else {
        setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>Definir Nova Meta</DialogTitle>
            <DialogDescription>
                Estabeleça um objetivo para alcançar.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">
                Conta
                </Label>
                <div className="col-span-3">
                    <select 
                        id="accountId" 
                        name="accountId" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.username} ({acc.platform})</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="metricType" className="text-right">
                Métrica
                </Label>
                <div className="col-span-3">
                    <select 
                        id="metricType" 
                        name="metricType" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                    >
                        <option value="followers">Seguidores</option>
                        <option value="views">Visualizações (Total)</option>
                        <option value="likes">Likes (Total)</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetValue" className="text-right">
                Alvo
                </Label>
                <Input
                id="targetValue"
                name="targetValue"
                type="number"
                placeholder="Ex: 10000"
                className="col-span-3"
                required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deadline" className="text-right">
                Prazo
                </Label>
                <Input
                id="deadline"
                name="deadline"
                type="date"
                className="col-span-3"
                />
            </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Meta
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
