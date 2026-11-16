"use client"

import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { useRims } from "@/lib/store"
import { ROLES, USERS } from "@/lib/referentiels"
import { cn } from "@/lib/utils"

export function PersonaGrid() {
  const router = useRouter()
  const setUser = useRims((s) => s.setUser)
  const people = USERS.filter((u) => !["u-ins2", "u-dir-hk", "u-exp2"].includes(u.id))
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((u, i) => (
        <motion.button
          key={u.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          onClick={() => {
            setUser(u.id)
            router.push("/tableau-de-bord")
          }}
          className={cn(
            "group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-brand-green/50 hover:shadow-xl",
            u.role === "demandeur" && "border-brand-green/40 bg-accent/40"
          )}
        >
          <div className="absolute -top-10 -right-10 size-28 rounded-full bg-brand-green/0 blur-2xl transition-colors group-hover:bg-brand-green/20" />
          <div className="relative flex items-start gap-3">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl font-heading text-sm font-bold", u.role === "demandeur" ? "bg-brand-green text-white" : "bg-brand-navy text-white dark:bg-sky-400/20 dark:text-sky-200")}>
              {u.initiales}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold tracking-wider text-brand-green uppercase">{ROLES[u.role].label}</div>
              <div className="truncate font-heading font-semibold">{u.nom}</div>
              <p className="mt-1 text-xs text-muted-foreground">{u.role === "demandeur" ? u.titre : ROLES[u.role].description}</p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-green" />
          </div>
        </motion.button>
      ))}
    </div>
  )
}
