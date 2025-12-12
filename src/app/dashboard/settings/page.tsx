import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase-server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Suas informações pessoais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
             </div>
             <div className="grid gap-2">
                <Label>ID do Usuário</Label>
                <Input value={user?.id || ''} disabled className="font-mono text-xs" />
             </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Assinatura</CardTitle>
                <CardDescription>Plano atual: Gratuito (Beta)</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" disabled>Gerenciar Assinatura</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
