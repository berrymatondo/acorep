"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      aria-label="Changer de thème"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  )
}
