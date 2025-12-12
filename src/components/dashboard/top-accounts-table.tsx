"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, TrendingUp, Eye } from "lucide-react"
import { Account } from "@/types"

interface TopAccountsTableProps {
  accounts: (Account & { views?: number })[]
}

export function TopAccountsTable({ accounts }: TopAccountsTableProps) {
  // Sort accounts by views (descending) just in case
  const sortedAccounts = [...accounts].sort((a, b) => (b.views || 0) - (a.views || 0));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Contas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados suficientes.</p>
          ) : (
            sortedAccounts.map((account, index) => (
              <div key={account.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                      index === 1 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{account.username}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{account.platform}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  {(account.views || 0).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
