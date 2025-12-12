import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { Users, Eye, ArrowUpRight, Activity } from "lucide-react"
import { DataService } from "@/services/data-service"
import { GlobalSyncButton } from "@/components/dashboard/global-sync-button"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const stats = await DataService.getDashboardStats();
  const accounts = await DataService.getAccounts();
  const chartData = await DataService.getMonthlyOverview();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <GlobalSyncButton />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% este mês</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Seguidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalFollowers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+180 novos hoje</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">+2% que a média</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">3 perto da meta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>Performance dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Contas Recentes</CardTitle>
            <CardDescription>Status das últimas contas adicionadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {accounts.slice(0, 5).map((account) => (
                <div key={account.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{account.username}</p>
                    <p className="text-sm text-muted-foreground capitalize">{account.platform}</p>
                  </div>
                  <div className="ml-auto font-medium">
                    <div className={`h-2.5 w-2.5 rounded-full ${account.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              ))}
              
              {accounts.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhuma conta encontrada.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
