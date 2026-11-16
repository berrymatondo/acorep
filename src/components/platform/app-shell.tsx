"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import {
  BookOpenCheck, Bell, FolderOpen, History, Inbox, LayoutDashboard, LogOut, Menu,
  Moon, Plus, QrCode, Radar, RotateCcw, Search, Sun, ChevronsUpDown, MapPin, Check, Boxes, Library, BookOpen, Workflow, PanelLeftClose, PanelLeftOpen, FileBarChart,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useCurrentUser, useHydrated, useRims } from "@/lib/store"
import { ROLES, USERS } from "@/lib/referentiels"
import { canSee, needsMyAction } from "@/lib/workflow"
import type { Role } from "@/lib/types"
import { fromNow } from "@/lib/dates"
import { Logo, LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CommandMenu } from "./command-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type NavItem = { href: string; label: string; icon: React.ElementType; roles?: Role[]; badge?: "queue" }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Pilotage",
    items: [
      { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/travail", label: "File de travail", icon: Inbox, badge: "queue", roles: ["secretariat", "bureau", "expert", "inspecteur", "finance", "cpop", "commission", "directeur", "dg"] },
      { href: "/modules", label: "Modules", icon: Boxes },
      { href: "/processus", label: "Processus", icon: Workflow },
      { href: "/rapports", label: "Rapports", icon: FileBarChart, roles: ["secretariat", "bureau", "expert", "inspecteur", "finance", "cpop", "commission", "directeur", "dg"] },
      { href: "/dossiers", label: "Dossiers", icon: FolderOpen },
      { href: "/nouvelle-demande", label: "Nouvelle demande", icon: Plus, roles: ["demandeur"] },
    ],
  },
  {
    group: "Contrôle",
    items: [
      { href: "/inspections", label: "Inspections", icon: Radar, roles: ["bureau", "inspecteur", "directeur", "dg"] },
      { href: "/registres", label: "Registres", icon: Library },
      { href: "/audit", label: "Journal d’audit", icon: History, roles: ["bureau", "directeur", "dg"] },
      { href: "/referentiels", label: "Référentiels", icon: BookOpenCheck, roles: ["secretariat", "bureau", "expert", "inspecteur", "finance", "cpop", "commission", "directeur", "dg"] },
    ],
  },
  {
    group: "Public",
    items: [{ href: "/verifier", label: "Vérifier un document", icon: QrCode }],
  },
  {
    group: "Aide",
    items: [{ href: "/documentation", label: "Documentation", icon: BookOpen }],
  },
]

function Sidebar({ onNavigate, collapsed = false, onToggle }: { onNavigate?: () => void; collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname()
  const user = useCurrentUser()
  const dossiers = useRims((s) => s.dossiers)
  const queue = useMemo(() => dossiers.filter((d) => needsMyAction(user, d)).length, [dossiers, user])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40 mask-fade-b" />
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand-green/20 blur-3xl" />
      <div className={cn("relative pt-5 pb-6", collapsed ? "flex justify-center px-2" : "px-5")}>
        <Link href="/" onClick={onNavigate} aria-label="Accueil ACOREP">
          {collapsed ? <LogoMark tile /> : <Logo tone="light" />}
        </Link>
      </div>
      <nav className={cn("relative flex-1 space-y-6 overflow-y-auto scrollbar-none", collapsed ? "px-2" : "px-3")}>
        {NAV.map((g) => {
          const items = g.items.filter((i) => !i.roles || i.roles.includes(user.role))
          if (!items.length) return null
          return (
            <div key={g.group}>
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-white/15" aria-hidden />
              ) : (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{g.group}</div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center rounded-xl py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-0" : "gap-3 px-3",
                        active ? "text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/12 to-white/4 ring-1 ring-white/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r bg-brand-green" />}
                      <item.icon className={cn("relative", collapsed ? "size-4.5" : "size-4", active ? "text-brand-lime" : "opacity-70")} />
                      {!collapsed && <span className="relative">{item.label}</span>}
                      {item.badge === "queue" && queue > 0 &&
                        (collapsed ? (
                          <span className="absolute top-0.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-brand-green px-1 font-mono text-[9px] font-bold text-white">
                            {queue}
                          </span>
                        ) : (
                          <span className="relative ml-auto rounded-full bg-brand-green px-1.5 py-px font-mono text-[10px] font-bold text-white">
                            {queue}
                          </span>
                        ))}
                    </Link>
                  )
                  if (!collapsed) return link
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                        {item.badge === "queue" && queue > 0 ? ` · ${queue}` : ""}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="relative mx-auto my-3 flex size-2" aria-label="Environnement de démonstration">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-green opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-green" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">Environnement de démonstration · données fictives</TooltipContent>
        </Tooltip>
      ) : (
        <div className="relative m-3 rounded-2xl border border-white/8 bg-white/4 p-3">
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-green opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-green" />
            </span>
            Environnement de démonstration
          </div>
          <p className="mt-1 text-[11px] leading-snug text-white/40">Données fictives, stockées localement dans le navigateur.</p>
        </div>
      )}
      {onToggle && (
        <div className={cn("relative border-t border-white/8 p-2", collapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
                aria-expanded={!collapsed}
                className={cn(
                  "flex items-center gap-3 rounded-xl py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white",
                  collapsed ? "justify-center px-2.5" : "w-full px-3"
                )}
              >
                {collapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4" />}
                {!collapsed && (
                  <>
                    Réduire le menu
                    <kbd className="ml-auto rounded border border-white/15 px-1.5 font-mono text-[10px] text-white/50">Ctrl B</kbd>
                  </>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Déplier le menu · Ctrl B</TooltipContent>}
          </Tooltip>
        </div>
      )}
    </div>
  )
}

function RoleSwitcher() {
  const user = useCurrentUser()
  const setUser = useRims((s) => s.setUser)
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-xl border bg-card py-1 pr-2 pl-1 text-left transition-colors hover:bg-muted">
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand-navy text-[11px] font-bold text-white">{user.initiales}</AvatarFallback>
          </Avatar>
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-semibold">{user.nom}</div>
            <div className="text-[10px] text-muted-foreground">{ROLES[user.role].short}</div>
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs">Changer de profil (démonstration des habilitations)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {USERS.filter((u) => !["u-ins2", "u-exp2"].includes(u.id)).map((u) => (
          <DropdownMenuItem
            key={u.id}
            className="gap-3 py-2"
            onClick={() => {
              setUser(u.id)
              toast.success(`Connecté en tant que ${u.nom}`, { description: `${ROLES[u.role].label} · ${u.province ?? "Toutes provinces"}` })
              router.push("/tableau-de-bord")
            }}
          >
            <Avatar className="size-7">
              <AvatarFallback className={cn("text-[10px] font-bold", u.role === "demandeur" ? "bg-brand-green text-white" : "bg-secondary")}>
                {u.initiales}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{u.nom}</div>
              <div className="truncate text-[10px] text-muted-foreground">
                {ROLES[u.role].label} · {u.province ?? "National"}
              </div>
            </div>
            {u.id === user.id && <Check className="size-4 text-brand-green" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" className="gap-2">
            <LogOut className="size-4" /> Quitter la plateforme
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Notifications() {
  const user = useCurrentUser()
  const notifs = useRims((s) => s.notifs)
  const dossiers = useRims((s) => s.dossiers)
  const markAllRead = useRims((s) => s.markAllRead)
  const mine = notifs.filter((n) => {
    const d = dossiers.find((x) => x.id === n.dossierId)
    if (!d || !canSee(user, d)) return false
    return (n.ownerId && n.ownerId === user.id) || n.forRoles.includes(user.role)
  })
  const unread = mine.filter((n) => !n.read).length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-lg" className="relative rounded-xl" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-brand-green font-mono text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-heading text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-brand-green hover:underline">
              Tout marquer lu
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {mine.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Aucune notification. Les actions effectuées par les autres profils apparaîtront ici.</p>
          ) : (
            mine.map((n) => (
              <Link key={n.id} href={`/dossiers/${n.dossierId}`} className="flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/60">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-brand-green")} />
                <div>
                  <p className="text-xs leading-snug">{n.text}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{fromNow(n.at)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="outline"
      size="icon-lg"
      className="rounded-xl"
      aria-label="Changer de thème"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const [open, setOpen] = useState(false)
  const [cmd, setCmd] = useState(false)
  const pathname = usePathname()
  const reset = useRims((s) => s.reset)
  const setUser = useRims((s) => s.setUser)
  const user = useCurrentUser()
  const asParam = useSearchParams().get("as")
  const collapsedPref = useRims((s) => s.sidebarCollapsed)
  const toggleSidebar = useRims((s) => s.toggleSidebar)
  // Avant restauration de l’état local, on garde la largeur par défaut (pas d’écart d’hydratation).
  const collapsed = hydrated && collapsedPref

  // Lien de démonstration : ?as=<identifiant de profil> ouvre l’écran avec ce profil.
  useEffect(() => {
    if (hydrated && asParam && USERS.some((u) => u.id === asParam)) setUser(asParam)
  }, [hydrated, asParam, setUser])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCmd((v) => !v)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggleSidebar])

  return (
    <div className="flex min-h-screen">
      <aside className={cn("no-print fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 ease-out lg:block", collapsed ? "w-18" : "w-64")}>
        {hydrated && <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />}
      </aside>
      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-18" : "lg:pl-64")}>
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur-xl md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="rounded-xl lg:hidden" aria-label="Menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-0 p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {hydrated && <Sidebar onNavigate={() => setOpen(false)} />}
            </SheetContent>
          </Sheet>
          <button
            onClick={() => setCmd(true)}
            className="flex h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-brand-green/40"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate"><span className="sm:hidden">Rechercher…</span><span className="hidden sm:inline">Rechercher un dossier, un établissement…</span></span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {hydrated && (
              <span className="hidden items-center gap-1.5 rounded-xl border bg-card px-2.5 py-2 text-xs font-medium md:flex">
                <MapPin className="size-3.5 text-brand-green" />
                {user.province ?? "National"}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-lg"
              className="hidden rounded-xl md:inline-flex"
              aria-label="Réinitialiser la démo"
              title="Réinitialiser les données de démonstration"
              onClick={() => {
                reset()
                toast("Données de démonstration réinitialisées")
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
            <ThemeToggle />
            {hydrated && <Notifications />}
            {hydrated ? <RoleSwitcher /> : <Skeleton className="h-10 w-40 rounded-xl" />}
          </div>
        </header>
        <main className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-dots opacity-60 mask-fade-b" />
          <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            {hydrated ? (
              <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {children}
              </motion.div>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-10 w-72" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                </div>
                <Skeleton className="h-96 rounded-2xl" />
              </div>
            )}
          </div>
        </main>
      </div>
      {hydrated && <CommandMenu open={cmd} onOpenChange={setCmd} />}
    </div>
  )
}


