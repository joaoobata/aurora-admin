"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, useSearchParams } from "next/navigation"
import { Account } from "@/types"

interface FilterBarProps {
  accounts: Account[]
}

export function FilterBar({ accounts }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentPlatform = searchParams.get('platform') || 'all'
  const currentAccount = searchParams.get('accountId') || 'all'

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
        params.delete(key)
    } else {
        params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Platform Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            {currentPlatform === 'all' ? 'Todas Plataformas' : currentPlatform} 
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem checked={currentPlatform === 'all'} onCheckedChange={() => updateFilter('platform', 'all')}>
            Todas
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={currentPlatform === 'tiktok'} onCheckedChange={() => updateFilter('platform', 'tiktok')}>
            TikTok
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={currentPlatform === 'instagram'} onCheckedChange={() => updateFilter('platform', 'instagram')}>
            Instagram
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={currentPlatform === 'youtube'} onCheckedChange={() => updateFilter('platform', 'youtube')}>
            YouTube
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            {currentAccount === 'all' 
                ? 'Todas Contas' 
                : accounts.find(a => a.id === currentAccount)?.username || 'Conta Selecionada'} 
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem checked={currentAccount === 'all'} onCheckedChange={() => updateFilter('accountId', 'all')}>
            Todas as Contas
          </DropdownMenuCheckboxItem>
          {accounts.map((acc) => (
             <DropdownMenuCheckboxItem 
                key={acc.id} 
                checked={currentAccount === acc.id} 
                onCheckedChange={() => updateFilter('accountId', acc.id)}
             >
                {acc.username} ({acc.platform})
             </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
