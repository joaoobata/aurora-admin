import { Sidebar } from "@/components/dashboard/sidebar"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
            {/* Mobile Header logic here (omitted for MVP simplicity) */}
             <span className="font-semibold">Aurora Admin</span>
             <div className="ml-auto w-[150px]">
               <ThemeToggle />
             </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
