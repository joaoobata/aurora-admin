import Link from "next/link"
import { LayoutDashboard, Target, Settings, LogOut, Users } from "lucide-react"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"

export function Sidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block w-64 h-screen fixed left-0 top-0">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="">Aurora Admin</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/accounts"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Users className="h-4 w-4" />
              Contas
            </Link>
            <Link
              href="/dashboard/goals"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Target className="h-4 w-4" />
              Metas
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4">
            <div className="mb-3">
              <ThemeToggle />
            </div>
            <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full">
                <LogOut className="h-4 w-4" />
                Sair
            </button>
        </div>
      </div>
    </div>
  )
}
