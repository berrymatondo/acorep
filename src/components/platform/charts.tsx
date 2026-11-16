"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { motion } from "motion/react"
import type { AuditEvent, Dossier } from "@/lib/types"
import { MODULES } from "@/lib/referentiels"
import { procDef } from "@/lib/procedures"
import { STAGES } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const SERIES = [
  { key: "depots", label: "Dépôts", color: "var(--series-1)" },
  { key: "notifs", label: "Décisions notifiées", color: "var(--series-2)" },
] as const

export function FlowChart({ events }: { events: AuditEvent[] }) {
  const data = useMemo(() => {
    const weeks = 12
    const now = new Date()
    const start = new Date(now.getTime() - weeks * 7 * 86400000)
    const rows = Array.from({ length: weeks }, (_, i) => {
      const d = new Date(start.getTime() + (i + 1) * 7 * 86400000)
      return { week:d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), depots: 0, notifs: 0 }
    })
    events.forEach((e) => {
      const t = new Date(e.at).getTime()
      const idx = Math.floor((t - start.getTime()) / (7 * 86400000))
      if (idx < 0 || idx >= weeks) return
      if (e.to === "depose") rows[idx].depots++
      if (e.to === "notifie") rows[idx].notifs++
    })
    return rows
  }, [events])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-[3px] w-4 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-muted-foreground">12 dernières semaines</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--grid-line)" strokeDasharray="0" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--axis-ink)" }} interval={1} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--axis-ink)" }} />
            <Tooltip
              cursor={{ stroke: "var(--axis-ink)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                    <div className="mb-1 font-semibold">Semaine du {label}</div>
                    {payload.map((p) => (
                      <div key={String(p.dataKey)} className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-muted-foreground">{SERIES.find((s) => s.key === p.dataKey)?.label}</span>
                        <span className="ml-auto pl-3 font-mono font-semibold">{p.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null
              }
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function PipelineBars({ dossiers }: { dossiers: Dossier[] }) {
  const rows = STAGES.slice(0, 9).map((s) => ({
    ...s,
    count: dossiers.filter((d) => d.status === s.id || (s.id === "recevabilite" && d.status === "complements")).length,
    paused: s.id === "recevabilite" ? dossiers.filter((d) => d.status === "complements").length : 0,
  }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <Link key={r.id} href={`/dossiers?statut=${r.id}`} className="group grid grid-cols-[110px_1fr_32px] items-center gap-3 rounded-lg py-0.5 text-xs">
          <span className="truncate text-muted-foreground group-hover:text-foreground">
            {r.label}
            {r.paused > 0 && <span className="block text-[10px] text-amber-600">dont {r.paused} suspendu{r.paused > 1 ? "s" : ""}</span>}
          </span>
          <div className="relative h-5 rounded-md bg-muted/70">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-md bg-[var(--series-1)] group-hover:brightness-110"
              initial={{ width: 0 }}
              animate={{ width: `${(r.count / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-right font-mono font-semibold">{r.count}</span>
        </Link>
      ))}
    </div>
  )
}

export function ModuleBar({ dossiers }: { dossiers: Dossier[] }) {
  const rows = MODULES.map((m) => ({ ...m, count: dossiers.filter((d) => procDef(d.type).module === m.id).length })).filter((r) => r.count > 0)
  const total = rows.reduce((a, r) => a + r.count, 0) || 1
  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {rows.map((r, i) => (
          <motion.div
            key={r.id}
            title={`${r.short} : ${r.count}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ background: r.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(r.count / total) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.06 }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <Link key={r.id} href={`/dossiers?module=${r.id}`} className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-xs hover:bg-muted/60">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: r.color }} />
            <span className="truncate text-muted-foreground">{r.short}</span>
            <span className="ml-auto font-mono font-semibold">{r.count}</span>
            <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">{Math.round((r.count / total) * 100)} %</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ProvinceBars({ dossiers }: { dossiers: Dossier[] }) {
  const map = new Map<string, number>()
  dossiers.forEach((d) => map.set(d.province, (map.get(d.province) ?? 0) + 1))
  const rows = [...map.entries()].sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <div className="space-y-1.5">
      {rows.map(([p, n], i) => (
        <div key={p} className="grid grid-cols-[100px_1fr_28px] items-center gap-3 text-xs">
          <span className={cn("truncate", p === "Kinshasa" ? "font-semibold" : "text-muted-foreground")}>{p}</span>
          <div className="h-4 rounded bg-muted/70">
            <motion.div
              className="h-full rounded bg-[var(--series-1)]"
              initial={{ width: 0 }}
              animate={{ width: `${(n / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.04 }}
            />
          </div>
          <span className="text-right font-mono font-semibold">{n}</span>
        </div>
      ))}
    </div>
  )
}
