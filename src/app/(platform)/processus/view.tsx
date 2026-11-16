"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, CornerDownLeft, CornerUpRight, FolderOpen, Gavel, Inbox, Layers, Timer, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dossier, ProcedureType, Role, Status } from "@/lib/types"
import { useCurrentUser, useNow, useRims } from "@/lib/store"
import { MODULES, ROLES, STATUS_META, moduleById } from "@/lib/referentiels"
import { DELAIS, PROCEDURE_DEFS, stageLabel, subjectTitle, type ProcedureDef } from "@/lib/procedures"
import { canSee } from "@/lib/workflow"
import { computeSla } from "@/lib/dates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DossierId, Empty, PageHeader, SlaRing } from "@/components/platform/bits"

/** Toutes les colonnes possibles de la vue d’ensemble, dans l’ordre du circuit. */
const ALL_STATES: Status[] = ["brouillon", "depose", "recevabilite", "complements", "paiement", "evaluation", "inspection", "cpop", "projet", "signature", "notifie", "archive"]

const CLOSED: Status[] = ["notifie", "archive"]

/** Profil attendu à une étape, pour une procédure donnée (vue générique, sans dossier). */
function stageRoles(def: ProcedureDef, s: Status): Role[] {
  switch (s) {
    case "brouillon":
    case "complements":
    case "notifie":
      return ["demandeur"]
    case "depose":
    case "archive":
      return ["secretariat"]
    case "recevabilite":
    case "projet":
      return ["bureau"]
    case "paiement":
      return ["finance", "demandeur"]
    case "evaluation":
      return [def.evaluation?.role ?? "expert"]
    case "inspection":
      return ["bureau", "inspecteur"]
    case "cpop":
      return [def.commission?.role ?? "cpop"]
    case "signature":
      return [def.signataire]
  }
}

const statesOf = (def: ProcedureDef) => ALL_STATES.filter((s) => s === "brouillon" || (s === "complements" ? def.stages.includes("recevabilite") : def.stages.includes(s)))

function countBy(dossiers: Dossier[]) {
  const m = new Map<string, number>()
  for (const d of dossiers) m.set(`${d.type}:${d.status}`, (m.get(`${d.type}:${d.status}`) ?? 0) + 1)
  return (t: ProcedureType, s: Status) => m.get(`${t}:${s}`) ?? 0
}

export default function ProcessusPage() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const visible = useMemo(() => all.filter((d) => canSee(user, d)), [all, user])
  const count = useMemo(() => countBy(visible), [visible])
  const [tab, setTab] = useState<string>("ensemble")

  const enCours = visible.filter((d) => !CLOSED.includes(d.status) && d.status !== "brouillon").length
  const complements = visible.filter((d) => d.status === "complements").length
  const aSigner = visible.filter((d) => d.status === "signature").length
  const clos = visible.filter((d) => CLOSED.includes(d.status)).length

  return (
    <>
      <PageHeader
        eyebrow="Cartographie des processus"
        title="Processus réglementaires"
        description="Chaque procédure, chaque état du circuit, et le nombre de dossiers qui s’y trouvent en ce moment. Les compteurs portent sur les dossiers visibles par votre profil."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Layers} label="Dossiers visibles" value={visible.length} />
        <Kpi icon={Inbox} label="En instruction" value={enCours} accent="var(--series-1)" />
        <Kpi icon={TriangleAlert} label="En attente de compléments" value={complements} accent="var(--series-4)" />
        <Kpi icon={Gavel} label="À signer · clos" value={`${aSigner} · ${clos}`} accent="var(--brand-green)" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 rounded-xl p-1">
          <TabsTrigger value="ensemble" className="gap-1.5">
            <Layers className="size-3.5" /> Vue d’ensemble
          </TabsTrigger>
          {PROCEDURE_DEFS.map((p) => {
            const n = visible.filter((d) => d.type === p.id).length
            return (
              <TabsTrigger key={p.id} value={p.id} className="gap-1.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: moduleById(p.module).color }} />
                {p.label}
                <span className="ml-0.5 rounded-full bg-foreground/8 px-1.5 font-mono text-[10px]">{n}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="ensemble">
          <Overview count={count} onOpen={setTab} />
        </TabsContent>

        {PROCEDURE_DEFS.map((p) => (
          <TabsContent key={p.id} value={p.id}>
            <ProcessView def={p} dossiers={visible.filter((d) => d.type === p.id)} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="card-elevated flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: accent ?? "var(--brand-navy)" }}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="font-heading text-2xl leading-none font-bold">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

/* ───────────────────────── Vue d’ensemble : procédures × états ───────────────────────── */

function Overview({ count, onOpen }: { count: (t: ProcedureType, s: Status) => number; onOpen: (t: string) => void }) {
  const max = Math.max(1, ...PROCEDURE_DEFS.flatMap((p) => statesOf(p).map((s) => count(p.id, s))))
  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
        <div>
          <h2 className="font-heading font-semibold">Toutes les procédures, tous les états</h2>
          <p className="text-xs text-muted-foreground">Cliquez sur une ligne pour ouvrir le schéma de la procédure. « · » = état absent du circuit.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          0
          <span className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--series-1) 8%, transparent), var(--series-1))" }} />
          {max}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-275 border-collapse text-sm">
          <thead>
            <tr className="text-[10.5px] tracking-wide text-muted-foreground uppercase">
              <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-semibold">Procédure</th>
              {ALL_STATES.map((s) => (
                <th key={s} className="px-1 py-3 text-center font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <span className={cn("size-1.5 rounded-full", STATUS_META[s].dot)} />
                    {STATUS_META[s].label}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) =>
              PROCEDURE_DEFS.filter((p) => p.module === m.id).map((p, i) => {
                const states = statesOf(p)
                const total = states.reduce((a, s) => a + count(p.id, s), 0)
                return (
                  <tr key={p.id} onClick={() => onOpen(p.id)} className={cn("group cursor-pointer hover:bg-muted/50", i === 0 && "border-t")}>
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 group-hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: m.color }} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.label}</div>
                          <div className="text-[10.5px] text-muted-foreground">{m.short}</div>
                        </div>
                      </div>
                    </td>
                    {ALL_STATES.map((s) => {
                      if (!states.includes(s)) return <td key={s} className="px-1 py-2.5 text-center text-muted-foreground/40">·</td>
                      const n = count(p.id, s)
                      const pct = n ? 15 + Math.round((n / max) * 85) : 0
                      return (
                        <td key={s} className="px-1 py-2.5 text-center">
                          <span
                            className={cn("inline-grid h-8 min-w-10 place-items-center rounded-lg font-mono text-xs font-semibold", n ? (pct > 55 ? "text-white" : "text-foreground") : "border border-dashed text-muted-foreground/60")}
                            style={n ? { background: `color-mix(in oklab, var(--series-1) ${pct}%, transparent)` } : undefined}
                          >
                            {n}
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 font-heading font-bold">
                        {total}
                        <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ───────────────────────── Schéma d’une procédure ───────────────────────── */

function ProcessView({ def, dossiers }: { def: ProcedureDef; dossiers: Dossier[] }) {
  const now = useNow()
  const mod = moduleById(def.module)
  const [selected, setSelected] = useState<Status | null>(null)
  const n = (s: Status) => dossiers.filter((d) => d.status === s).length
  const main: Status[] = ["brouillon", ...def.stages]
  const hasComplements = def.stages.includes("recevabilite")
  const peak = Math.max(1, ...main.filter((s) => !CLOSED.includes(s)).map(n), hasComplements ? n("complements") : 0)
  const enRetard = dossiers.filter((d) => computeSla(d, new Date(now)).level === "danger").length
  const decided = dossiers.filter((d) => d.decision?.signeLe)
  const list = selected ? dossiers.filter((d) => d.status === selected) : []

  return (
    <div className="space-y-5">
      {/* En-tête de la procédure */}
      <section className="card-elevated relative overflow-hidden p-5">
        <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: mod.color }} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 pl-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: mod.color }}>
              {mod.label}
            </div>
            <h2 className="mt-0.5 font-heading text-xl font-bold">{def.label}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{def.description}</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <Fact icon={FolderOpen} label="Dossiers" value={dossiers.length} />
            <Fact icon={Timer} label="Délai cible" value={`${DELAIS[def.id]} j.o.`} />
            <Fact icon={TriangleAlert} label="Délai critique" value={enRetard} warn={enRetard > 0} />
            <Fact icon={Gavel} label="Signataire" value={ROLES[def.signataire].short} />
          </div>
        </div>
      </section>

      {/* Schéma du circuit */}
      <section className="card-elevated p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-semibold">Circuit et dossiers par état</h3>
            <p className="text-xs text-muted-foreground">
              {def.stages.length} étapes · niveau {def.niveau} · cliquez sur un état pour voir ses dossiers.
            </p>
          </div>
          <Legend />
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-2">
          <div className="flex w-max items-start">
            {main.map((s, i) => (
              <div key={s} className="flex items-start">
                {i > 0 && <Connector dashed={s === "depose"} />}
                <div className="flex flex-col items-center">
                  <StateNode
                    def={def}
                    status={s}
                    step={s === "brouillon" ? null : i}
                    count={n(s)}
                    peak={peak}
                    active={selected === s}
                    onClick={() => setSelected(selected === s ? null : s)}
                    delay={i * 0.05}
                  />
                  {s === "recevabilite" && hasComplements && (
                    <>
                      <div className="flex h-10 w-full items-center justify-center gap-6 text-amber-600 dark:text-amber-400">
                        <span className="flex flex-col items-center text-[9.5px] font-medium">
                          <CornerUpRight className="size-4 rotate-90" />
                          incomplet
                        </span>
                        <span className="flex flex-col items-center text-[9.5px] font-medium">
                          <CornerDownLeft className="size-4 -rotate-90" />
                          complété
                        </span>
                      </div>
                      <StateNode
                        def={def}
                        status="complements"
                        step={null}
                        count={n("complements")}
                        peak={peak}
                        active={selected === "complements"}
                        onClick={() => setSelected(selected === "complements" ? null : "complements")}
                        delay={0.2}
                        branch
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Issues de la décision */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">Issues possibles</span>
          {def.outcomes.map((o) => {
            const k = decided.filter((d) => d.decision?.issue === o.id).length
            return (
              <span
                key={o.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  o.positive ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                )}
              >
                {o.label}
                <span className="rounded-full bg-background/70 px-1.5 font-mono text-[10px]">{k}</span>
              </span>
            )
          })}
          {def.parent && <span className="ml-auto text-xs text-muted-foreground">Prérequis : {def.parent.label}{def.parent.delaiJours ? ` (≤ ${def.parent.delaiJours} j)` : ""}</span>}
        </div>
      </section>

      {/* Dossiers de l’état sélectionné */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.section key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="card-elevated overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
              <h3 className="font-heading font-semibold">
                {stageLabel(def.id, selected).label} <span className="text-muted-foreground">· {list.length} dossier(s)</span>
              </h3>
              <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">
                Fermer
              </button>
            </div>
            {list.length === 0 ? (
              <div className="p-5">
                <Empty icon={FolderOpen} title="Aucun dossier à cet état" text="Aucun dossier visible par votre profil ne se trouve à cette étape." />
              </div>
            ) : (
              <ul className="divide-y">
                {list.map((d) => (
                  <li key={d.id}>
                    <Link href={`/dossiers/${d.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50">
                      <SlaRing dossier={d} size={36} />
                      <div className="min-w-0 flex-1">
                        <DossierId id={d.id} />
                        <div className="truncate text-sm">{subjectTitle(d)}</div>
                      </div>
                      <span className="hidden text-xs text-muted-foreground sm:block">{d.province}</span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function Fact({ icon: Icon, label, value, warn }: { icon: React.ElementType; label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className={cn("min-w-24 rounded-xl bg-muted/50 px-3 py-2", warn && "bg-rose-500/10 text-rose-700 dark:text-rose-300")}>
      <Icon className="mx-auto mb-1 size-3.5 opacity-60" />
      <div className="font-heading text-lg leading-none font-bold">{value}</div>
      <div className="mt-1 text-[10.5px] text-muted-foreground">{label}</div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-brand-green" /> état le plus chargé
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm border-2 border-dashed border-amber-500" /> boucle de compléments (délai suspendu)
      </span>
    </div>
  )
}

function Connector({ dashed }: { dashed?: boolean }) {
  return (
    <div className="mt-16.5 flex w-8 shrink-0 items-center">
      <div className={cn("h-0.5 flex-1", dashed ? "border-t-2 border-dashed border-border" : "bg-border")} />
      <ArrowRight className="-ml-1.5 size-3.5 text-muted-foreground" />
    </div>
  )
}

function StateNode({
  def,
  status,
  step,
  count,
  peak,
  active,
  onClick,
  delay,
  branch,
}: {
  def: ProcedureDef
  status: Status
  step: number | null
  count: number
  peak: number
  active: boolean
  onClick: () => void
  delay: number
  branch?: boolean
}) {
  const meta = STATUS_META[status]
  const lab = stageLabel(def.id, status)
  const closed = CLOSED.includes(status)
  const hot = !closed && count > 0 && count === peak
  const roles = stageRoles(def, status)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className={cn(
        "relative flex h-37 w-37 shrink-0 flex-col rounded-2xl border bg-card p-3 text-left transition-shadow hover:shadow-lg",
        branch && "border-2 border-dashed border-amber-500/70 bg-amber-500/5",
        status === "brouillon" && "border-dashed bg-muted/30",
        hot && "border-brand-green ring-2 ring-brand-green/25",
        active && "ring-2 ring-foreground/40"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", meta.tone)}>
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {step ? `Étape ${step}` : branch ? "Boucle" : "Avant dépôt"}
        </span>
        {hot && <span className="size-2 animate-pulse rounded-full bg-brand-green" />}
      </div>
      <div className="mt-2 line-clamp-2 text-[13px] leading-tight font-semibold">{lab.label}</div>
      <div className="mt-0.5 line-clamp-1 text-[10.5px] text-muted-foreground">{roles.map((r) => ROLES[r].short).join(" · ")}</div>
      <div className="mt-auto flex items-end justify-between">
        <span className={cn("font-heading text-3xl leading-none font-bold tabular-nums", count === 0 && "text-muted-foreground/40")}>{count}</span>
        <span className="text-[10px] text-muted-foreground">dossier{count > 1 ? "s" : ""}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", hot ? "bg-brand-green" : meta.dot)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (count / peak) * 100)}%` }}
          transition={{ duration: 0.6, delay: delay + 0.1 }}
        />
      </div>
    </motion.button>
  )
}
