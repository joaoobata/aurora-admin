import { DataService } from "@/services/data-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddGoalDialog } from "@/components/dashboard/add-goal-dialog"
import { DeleteGoalButton } from "@/components/dashboard/delete-goal-button"
import { Target } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const goals = await DataService.getGoals()
  const accounts = await DataService.getAccounts() // Needed for the add dialog

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso dos seus objetivos.
          </p>
        </div>
        <AddGoalDialog accounts={accounts} />
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {goals.map((goal) => {
            const progress = Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
            
            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-base font-medium">
                                {goal.metricType === 'followers' ? 'Seguidores' : 
                                 goal.metricType === 'views' ? 'Visualizações' : 'Likes'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{goal.account.username}</p>
                        </div>
                    </div>
                    <DeleteGoalButton goalId={goal.id} />
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-muted-foreground">Progresso</span>
                            <span className="font-bold">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Atual: {goal.currentValue.toLocaleString()}</span>
                            <span>Meta: {goal.targetValue.toLocaleString()}</span>
                        </div>
                        {goal.deadline && (
                            <p className="text-xs text-muted-foreground mt-2 text-right">
                                Prazo: {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </CardContent>
              </Card>
            )
        })}

        {goals.length === 0 && (
            <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                <p className="text-muted-foreground mb-4">Nenhuma meta definida.</p>
                <AddGoalDialog accounts={accounts} />
            </div>
        )}
      </div>
    </div>
  )
}
