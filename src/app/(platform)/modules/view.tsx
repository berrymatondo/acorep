"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Building2, Check, Ellipsis, FileBadge, Hospital, Pill, Plus } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { MODULES } from "@/lib/referentiels"
import { DELAIS, procDef, proceduresOf } from "@/lib/procedures"
import { canSee, needsMyAction } from "@/lib/workflow"
import { buildRegistry } from "@/lib/registres"
import type { ModuleId } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/platform/bits"

const ICONS: Record<ModuleId, React.ElementType> = { etablissements: Building2, produits: Pill, amm: FileBadge, medicaux: Hospital, autres: Ellipsis }

export default function ModulesPage() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const visible = all.filter((d) => canSee(user, d))
  const registry = buildRegistry(visible)
  const isApplicant = user.role === "demandeur"

  return (
    <>
      <PageHeader
        eyebrow="Vision RIMS"
        title="Modules réglementaires"
        description="Un même moteur de workflow, des circuits adaptés à chaque procédure : dépôt, évaluation, inspection, décision, notification et registre."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {MODULES.map((m, i) => {
          const Icon = ICONS[m.id]
          const dossiers = visible.filter((d) => procDef(d.type).module === m.id)
          const enCours = dossiers.filter((d) => !["notifie", "archive", "brouillon"].includes(d.status)).length
          const mine = dossiers.filter((d) => needsMyAction(user, d)).length
          const titres = registry.filter((e) => e.module === m.id && e.statut !== "retiree").length
          return (
            <motion.section
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-elevated relative flex flex-col overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: m.color }} />
              <div className="flex items-start gap-4 p-6 pb-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: m.color }}>
                  <Icon className="size-7" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-xl leading-tight font-bold">{m.label}</h2>
                  <ul className="mt-2 space-y-1">
                    {m.points.map((p) => (
                      <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mx-6 grid grid-cols-3 gap-2 rounded-2xl bg-muted/50 p-3 text-center">
                <div><div className="font-heading text-2xl font-bold">{enCours}</div><div className="text-[11px] text-muted-foreground">en instruction</div></div>
                <div><div className="font-heading text-2xl font-bold text-brand-green">{mine}</div><div className="text-[11px] text-muted-foreground">pour vous</div></div>
                <div><div className="font-heading text-2xl font-bold">{titres}</div><div className="text-[11px] text-muted-foreground">titres en vigueur</div></div>
              </div>
              <div className="flex-1 space-y-2 p-6 pt-4">
                {proceduresOf(m.id).map((p) => {
                  const n = dossiers.filter((d) => d.type === p.id).length
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.label}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.stages.length} étapes · {DELAIS[p.id]} j.o. · {p.niveau === "central" ? "niveau central" : "provincial"} · {n} dossier(s)
                        </div>
                      </div>
                      {isApplicant ? (
                        p.parent ? (
                          <span className="text-[11px] text-muted-foreground">via un titre existant</span>
                        ) : (
                          <Button asChild size="sm" variant="outline" className="rounded-lg">
                            <Link href={`/nouvelle-demande?type=${p.id}`}><Plus /> Déposer</Link>
                          </Button>
                        )
                      ) : null}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between border-t px-6 py-3 text-sm">
                <span className="text-xs text-muted-foreground">Délivrable : <b className="text-foreground">{m.deliverable}</b></span>
                <Link href={`/dossiers?module=${m.id}`} className="flex items-center gap-1 font-medium text-brand-green hover:underline">
                  Dossiers <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.section>
          )
        })}
      </div>
    </>
  )
}
