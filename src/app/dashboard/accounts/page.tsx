import { DataService } from "@/services/data-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddAccountDialog } from "@/components/dashboard/add-account-dialog"
import Link from "next/link"
import { ExternalLink, Trash2 } from "lucide-react"
import { DeleteAccountButton } from "@/components/dashboard/delete-account-button"

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const accounts = await DataService.getAccounts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie seus perfis e canais monitorados.
          </p>
        </div>
        <AddAccountDialog />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-medium text-muted-foreground uppercase">{account.platform}</span>
                 {account.status === 'active' && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                 )}
              </div>
              <CardTitle className="text-xl">
                  <Link href={`/dashboard/accounts/${account.id}`} className="hover:underline">
                    {account.username}
                  </Link>
              </CardTitle>
              {account.url && (
                  <Link href={account.url} target="_blank" className="text-xs text-muted-foreground flex items-center hover:text-primary">
                    Abrir link <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
              )}
            </CardHeader>
            <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground">
                    Cadastrado em {new Date(account.createdAt).toLocaleDateString()}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
              <Link href={`/dashboard/accounts/${account.id}`}>
                 <Button variant="outline" size="sm">Ver Detalhes</Button>
              </Link>
              <DeleteAccountButton accountId={account.id} />
            </CardFooter>
          </Card>
        ))}

        {accounts.length === 0 && (
            <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                <p className="text-muted-foreground mb-4">Nenhuma conta cadastrada ainda.</p>
                <AddAccountDialog />
            </div>
        )}
      </div>
    </div>
  )
}
