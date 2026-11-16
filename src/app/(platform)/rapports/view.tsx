"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { CalendarClock, Check, Eye, FileBarChart, FileDown, Gavel, Layers, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser, useNow, useRims } from "@/lib/store"
import { MODULES, PROVINCES } from "@/lib/referentiels"
import { PROCEDURE_DEFS } from "@/lib/procedures"
import { canSee } from "@/lib/workflow"
import { DEFAULT_PARAMS, PERIODES, RAPPORTS, dossiersFor, toQuery, type Periode, type RapportParams, type RapportType } from "@/lib/rapports"
import type { ModuleId, ProcedureType } from "@/lib/types"
import { PageHeader } from "@/components/platform/bits"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ICONS: Record<RapportType, React.ElementType> = { activite: FileBarChart, delais: Timer, decisions: Gavel, procedure: Layers }

export default function RapportsPage() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const now = useNow()
  const [p, setP] = useState<RapportParams>(DEFAULT_PARAMS)
  const set = <K extends keyof RapportParams>(k: K, v: RapportParams[K]) => setP((x) => ({ ...x, [k]: v }))

  // Provinces proposées : celles des dossiers visibles (un agent provincial ne voit que la sienne).
  const provinces = useMemo(() => {
    const seen = new Set(all.filter((d) => canSee(user, d)).map((d) => d.province))
    return PROVINCES.filter((x) => seen.has(x))
  }, [all, user])
  const n = dossiersFor(user, all, p, now).length
  const url = `/impression/rapport?${toQuery(p)}`

  return (
    <>
      <PageHeader
        eyebrow="Pilotage · Rapports"
        title="Rapports PDF"
        description="Choisissez un rapport et son périmètre, puis générez-le au format A4. Il ne porte que sur les dossiers visibles par votre profil."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(RAPPORTS) as RapportType[]).map((t, i) => {
            const r = RAPPORTS[t]
            const Icon = ICONS[t]
            const active = p.type === t
            return (
              <motion.button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "card-elevated relative flex flex-col p-5 text-left transition-all hover:-translate-y-0.5",
                  active && "border-brand-green ring-2 ring-brand-green/25"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn("grid size-11 place-items-center rounded-xl", active ? "bg-brand-green text-white" : "bg-muted text-foreground")}>
                    <Icon className="size-5" />
                  </span>
                  {active && <Check className="size-5 text-brand-green" />}
                </div>
                <h2 className="mt-3 font-heading font-semibold">{r.titre}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                <ul className="mt-3 space-y-1">
                  {r.contenu.map((c) => (
                    <li key={c} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-green" /> {c}
                    </li>
                  ))}
                </ul>
              </motion.button>
            )
          })}
        </div>

        <aside className="card-elevated h-fit space-y-4 p-5 xl:sticky xl:top-24">
          <h2 className="font-heading font-semibold">Périmètre</h2>

          {p.type === "procedure" ? (
            <Field label="Procédure">
              <Select value={p.procedure} onValueChange={(v) => set("procedure", v as ProcedureType)}>
                <SelectTrigger className="h-9 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROCEDURE_DEFS.map((x) => (
                    <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field label="Module">
              <Select value={p.module} onValueChange={(v) => set("module", v as ModuleId | "all")}>
                <SelectTrigger className="h-9 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {MODULES.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Province">
            <Select value={p.province} onValueChange={(v) => set("province", v)}>
              <SelectTrigger className="h-9 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{user.province ? user.province : "Toutes les provinces"}</SelectItem>
                {!user.province && provinces.map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Période (date de dépôt)">
            <Select value={p.periode} onValueChange={(v) => set("periode", v as Periode)}>
              <SelectTrigger className="h-9 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIODES) as Periode[]).map((k) => (
                  <SelectItem key={k} value={k}>{PERIODES[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
            <CalendarClock className="size-4 text-brand-green" />
            <span><b>{n}</b> dossier{n > 1 ? "s" : ""} dans le périmètre</span>
          </div>

          <div className="grid gap-2">
            <Button asChild className="h-10 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90">
              <a href={`${url}&print=1`} target="_blank" rel="noopener">
                <FileDown /> Générer le PDF
              </a>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <a href={url} target="_blank" rel="noopener">
                <Eye /> Aperçu avant impression
              </a>
            </Button>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Le rapport s’ouvre dans un nouvel onglet ; choisissez « Enregistrer au format PDF » comme imprimante.
          </p>
        </aside>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
