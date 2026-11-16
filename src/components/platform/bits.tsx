"use client"

import { motion } from "motion/react"
import { Check, CirclePause } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dossier, Status } from "@/lib/types"
import { STATUS_META } from "@/lib/referentiels"
import { PROCEDURES, procDef } from "@/lib/procedures"
import { moduleById } from "@/lib/referentiels"
import { computeSla, fmtDate } from "@/lib/dates"
import { stagesFor } from "@/lib/workflow"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", m.tone, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot, status !== "archive" && status !== "notifie" && "animate-pulse")} />
      {m.label}
    </span>
  )
}

export function TypeTag({ type }: { type: Dossier["type"] }) {
  const color = moduleById(procDef(type).module).color
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {PROCEDURES[type].short}
    </span>
  )
}

export function DossierId({ id, className }: { id: string; className?: string }) {
  return <span className={cn("font-mono text-[0.8rem] font-semibold tracking-tight", className)}>{id}</span>
}

const LEVEL_COLOR = {
  ok: "var(--st-good)",
  warn: "var(--st-warning)",
  danger: "var(--st-critical)",
  done: "var(--brand-navy)",
  na: "var(--muted-foreground)",
}

export function SlaRing({ dossier, size = 44, showLabel = false }: { dossier: Dossier; size?: number; showLabel?: boolean }) {
  const sla = computeSla(dossier)
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  const color = LEVEL_COLOR[sla.level]
  const paused = dossier.status === "complements"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3.5} className="text-muted" />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c * (1 - sla.ratio) }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              {sla.level === "done" ? (
                <Check className="size-3.5 text-brand-navy dark:text-sky-300" />
              ) : paused ? (
                <CirclePause className="size-3.5 text-amber-500" />
              ) : (
                <span className="font-mono text-[10px] font-bold" style={{ color }}>
                  {sla.level === "na" ? "—" : sla.remaining}
                </span>
              )}
            </div>
          </div>
          {showLabel && (
            <div className="text-xs leading-tight">
              <div className="font-semibold">
                {sla.level === "done" ? `Notifié en ${sla.consumed} j.o.` : sla.level === "na" ? "Non démarré" : `${sla.remaining} j.o. restants`}
              </div>
              <div className="text-muted-foreground">
                {paused ? "Délai suspendu" : `${sla.consumed}/${sla.total} j.o.${sla.suspended ? ` · ${sla.suspended} suspendus` : ""}`}
              </div>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Délai d’instruction : {sla.total} jours ouvrables</p>
        <p className="opacity-80">
          {sla.consumed} consommés · {sla.suspended} suspendus · échéance {fmtDate(sla.deadline)}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export function WorkflowStepper({ dossier, compact = false }: { dossier: Dossier; compact?: boolean }) {
  const stages = stagesFor(dossier)
  const current = dossier.status === "complements" ? "recevabilite" : dossier.status
  const ci = dossier.status === "brouillon" ? -1 : stages.findIndex((s) => s.id === current)
  const done = dossier.status === "archive"
  return (
    <div className="relative">
      <div className={cn("flex items-start", compact ? "gap-1" : "gap-0")}>
        {stages.map((s, i) => {
          const state = done || i < ci ? "done" : i === ci ? "current" : "todo"
          return (
            <div key={s.id} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <div className="absolute top-[15px] right-1/2 left-[-50%] h-[2px] bg-border">
                  <motion.div
                    className="h-full bg-brand-green"
                    initial={{ width: 0 }}
                    animate={{ width: state !== "todo" ? "100%" : "0%" }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                  />
                </div>
              )}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative z-10 grid size-8 place-items-center rounded-full border-2 text-xs font-bold transition-colors",
                  state === "done" && "border-brand-green bg-brand-green text-white",
                  state === "current" &&
                    (dossier.status === "complements"
                      ? "border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                      : "border-brand-navy bg-card text-brand-navy dark:border-sky-400 dark:text-sky-300"),
                  state === "todo" && "border-border bg-card text-muted-foreground"
                )}
              >
                {state === "current" && <span className="absolute inset-0 animate-ping rounded-full border-2 border-current opacity-30" />}
                {state === "done" ? <Check className="size-4" /> : i + 1}
              </motion.div>
              {!compact && (
                <div className="mt-2 px-1 text-center">
                  <div className={cn("text-[11px] font-semibold leading-tight", state === "todo" && "text-muted-foreground")}>{s.label}</div>
                  <div className="mt-0.5 hidden text-[10px] leading-tight text-muted-foreground xl:block">{s.hint}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green">{eyebrow}</div>}
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Empty({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <div className="font-heading font-semibold">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export function Hash({ value, n = 10 }: { value: string; n?: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <code className="cursor-help rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
          {value.slice(0, n)}…{value.slice(-4)}
        </code>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-all font-mono text-[10px]">SHA-256 · {value}</TooltipContent>
    </Tooltip>
  )
}
