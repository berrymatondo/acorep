"use client"

import Link from "next/link"
import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, Download, FolderOpen, Plus, Search, ShieldAlert } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { canSee, ownerRole, needsMyAction } from "@/lib/workflow"
import { CATEGORIES, MODULES, ROLES, STATUS_META, categoryById, moduleById } from "@/lib/referentiels"
import { PROCEDURES, PROCEDURE_DEFS, procDef, subjectSubtitle, subjectTitle } from "@/lib/procedures"
import type { ModuleId } from "@/lib/types"
import { computeSla, fmtDate } from "@/lib/dates"
import type { Status } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DossierId, Empty, PageHeader, SlaRing, StatusBadge, TypeTag } from "@/components/platform/bits"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function DossiersInner() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const sp = useSearchParams()
  const router = useRouter()
  const [q, setQ] = useState("")
  const statut = sp.get("statut") ?? "all"
  const [mod, setMod] = useState<ModuleId | "all">((sp.get("module") as ModuleId) ?? "all")
  const [type, setType] = useState("all")
  const [cat, setCat] = useState("all")
  const [tri, setTri] = useState(sp.get("tri") ?? "recent")

  const visible = useMemo(() => all.filter((d) => canSee(user, d)), [all, user])
  const hidden = all.length - visible.length
  const rows = useMemo(() => {
    const ql = q.toLowerCase()
    const r = visible.filter(
      (d) =>
        (statut === "all" || d.status === statut || (statut === "recevabilite" && d.status === "complements")) &&
        (mod === "all" || procDef(d.type).module === mod) &&
        (type === "all" || d.type === type) &&
        (cat === "all" || d.categorie === cat) &&
        (!ql || [d.id, subjectTitle(d), d.details?.dci ?? "", d.etablissement.nom, d.etablissement.commune, d.promoteur.nom, d.province].join(" ").toLowerCase().includes(ql))
    )
    if (tri === "delai") return r.map((d) => ({ d, s: computeSla(d) })).sort((a, b) => (a.s.level === "done" ? 1 : 0) - (b.s.level === "done" ? 1 : 0) || a.s.remaining - b.s.remaining).map((x) => x.d)
    return r.sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt))
  }, [visible, q, statut, mod, type, cat, tri])

  const setStatut = (v: string) => router.replace(v === "all" ? "/dossiers" : `/dossiers?statut=${v}`)

  const exportCsv = () => {
    const header = ["Numero", "Module", "Type", "Statut", "Province", "Categorie", "Objet", "Demandeur", "Commune", "Promoteur", "Depot"]
    const lines = rows.map((d) => [d.id, moduleById(procDef(d.type).module).short, PROCEDURES[d.type].label, STATUS_META[d.status].label, d.province, categoryById(d.categorie).label, subjectTitle(d), d.etablissement.nom, d.etablissement.commune, d.promoteur.nom, d.submittedAt ?? ""].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";"))
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `registre-acorep-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success("Registre exporté", { description: "L’export est journalisé (exigence de confidentialité)." })
  }

  const chips: (Status | "all")[] = ["all", "depose", "recevabilite", "complements", "paiement", "evaluation", "inspection", "cpop", "projet", "signature", "notifie", "archive"]
  const procs = PROCEDURE_DEFS.filter((p) => mod === "all" || p.module === mod)
  const cats = CATEGORIES.filter((c) => procs.some((p) => p.categoryGroup === c.group))

  return (
    <>
      <PageHeader
        eyebrow={user.role === "demandeur" ? "Portail demandeur" : "Registre des demandes · annexe 09"}
        title={user.role === "demandeur" ? "Mes dossiers" : "Dossiers"}
        description={
          user.role === "demandeur"
            ? "Toutes vos demandes, leur état et les actions attendues."
            : `Registre ${user.province ? `de la province de ${user.province}` : "national"} — numérotation unique, suivi d’état et délais.`
        }
        actions={
          <>
            {user.role !== "demandeur" && (
              <Button variant="outline" onClick={exportCsv} className="h-9 rounded-xl">
                <Download /> Exporter
              </Button>
            )}
            {user.role === "demandeur" && (
              <Button asChild className="h-9 rounded-xl bg-brand-green text-white hover:bg-brand-green/90">
                <Link href="/nouvelle-demande">
                  <Plus /> Nouvelle demande
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[{ id: "all" as const, short: "Tous les modules", color: "var(--muted-foreground)" }, ...MODULES].map((m) => {
          const n = m.id === "all" ? visible.length : visible.filter((d) => procDef(d.type).module === m.id).length
          const active = mod === m.id
          return (
            <button
              key={m.id}
              onClick={() => { setMod(m.id); setType("all"); setCat("all") }}
              className={cn("flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all", active ? "border-foreground/30 bg-card shadow-sm" : "border-transparent text-muted-foreground hover:bg-card")}
            >
              <span className="size-2 rounded-full" style={{ background: m.color }} />
              {m.short}
              <span className="font-mono text-[10px] text-muted-foreground">{n}</span>
            </button>
          )
        })}
      </div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {chips.map((c) => {
          const n = c === "all" ? visible.length : visible.filter((d) => d.status === c).length
          const active = statut === c
          return (
            <button
              key={c}
              onClick={() => setStatut(c)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active ? "border-brand-navy bg-brand-navy text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950" : "bg-card hover:border-foreground/20"
              )}
            >
              {c === "all" ? "Tous" : STATUS_META[c].label}
              <span className={cn("font-mono text-[10px]", active ? "opacity-80" : "text-muted-foreground")}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par numéro, produit, DCI, établissement, commune…" className="h-9 rounded-xl pl-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-full rounded-xl md:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes procédures</SelectItem>
              {procs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-9 w-full rounded-xl md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {cats.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tri} onValueChange={setTri}>
            <SelectTrigger className="h-9 w-full rounded-xl md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="delai">Délai restant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <Empty icon={FolderOpen} title="Aucun dossier" text="Aucun dossier ne correspond à ces critères dans votre périmètre." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="px-4 py-2.5 font-medium">Dossier</th>
                  <th className="px-4 py-2.5 font-medium">Établissement</th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Catégorie</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Action attendue</th>
                  <th className="px-4 py-2.5 font-medium">Délai</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const r = ownerRole(d)
                  const mine = needsMyAction(user, d)
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3) }}
                      onClick={() => router.push(`/dossiers/${d.id}`)}
                      className={cn("group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50", mine && "bg-brand-green/[0.04]")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {mine && <span className="size-1.5 rounded-full bg-brand-green" title="Action attendue de votre part" />}
                          <DossierId id={d.id} />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <TypeTag type={d.type} />
                          <span className="text-[11px] text-muted-foreground">{fmtDate(d.submittedAt ?? d.createdAt, "dd/MM/yy")}</span>
                        </div>
                      </td>
                      <td className="max-w-64 px-4 py-3">
                        <div className="truncate font-medium">{subjectTitle(d)}</div>
                        <div className="truncate text-xs text-muted-foreground">{subjectSubtitle(d)}</div>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="flex items-center gap-2 text-xs">
                          <span className="size-2 rounded-sm" style={{ background: moduleById(procDef(d.type).module).color }} />
                          {categoryById(d.categorie).label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-xs md:table-cell">
                        {r ? <span className={cn(mine ? "font-semibold text-brand-green" : "text-muted-foreground")}>{mine ? "Vous" : ROLES[r].short}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <SlaRing dossier={d} size={36} />
                      </td>
                      <td className="pr-3">
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {hidden > 0 && user.role !== "demandeur" && (
          <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            <ShieldAlert className="size-3.5" />
            {hidden} dossier(s) hors de votre périmètre (autres provinces ou brouillons) ne sont pas affichés — cloisonnement par province et rôle.
          </div>
        )}
      </div>
    </>
  )
}

export default function DossiersPage() {
  return (
    <Suspense>
      <DossiersInner />
    </Suspense>
  )
}
