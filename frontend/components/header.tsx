import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <ThemeToggle />
    </header>
  )
}