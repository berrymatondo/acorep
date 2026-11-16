"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Ban, ChevronDown, FileText, Library, Search } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { MODULES, ROLES } from "@/lib/referentiels"
import { procDef } from "@/lib/procedures"
import { canSee } from "@/lib/workflow"
import { buildRegistry, REGISTRY_STATUS, type RegistryEntry } from "@/lib/registres"
import { fmtDate } from "@/lib/dates"
import type { Dossier, ModuleId, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Empty, PageHeader, TypeTag } from "@/components/platform/bits"
import { cn } from "@/lib/utils"

function canRetire(u: User, d: Dossier) {
  const def = procDef(d.type)
  if (u.role === "dg") return true
  return def.niveau === "provincial" && u.role === "directeur" && u.province === d.province
}

function RetraitDialog({ e }: { e: RegistryEntry }) {
  const act = useRims((s) => s.act)
  const user = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [motif, setMotif] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"><Ban /> Retirer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retrait — {e.titre}</DialogTitle>
          <DialogDescription>
            Le retrait est immédiat et opposable : le document devient « retiré » lors de toute vérification publique. Motif obligatoire, inscrit au journal d’audit.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={motif} onChange={(x) => setMotif(x.target.value)} rows={4} placeholder="Motif du retrait (défaut qualité, rapport de vigilance, fraude…)" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            variant="destructive"
            disabled={motif.trim().length < 10}
            onClick={() => {
              act(e.dossier.id, `Retrait prononcé — ${e.numero}`, (x) => ({ decision: { ...x.decision!, retrait: { le: new Date().toISOString(), motif: motif.trim(), par: user.id } } }), {
                comment: motif.trim(),
                notify: { text: `Retrait de ${e.numero} (${e.titre})`, roles: ["dg", "secretariat"], owner: true },
              })
              setOpen(false)
              toast.error("Titre retiré", { description: `${e.numero} est désormais signalé comme retiré.` })
            }}
          >
            Prononcer le retrait
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ e, user, i }: { e: RegistryEntry; user: User; i: number }) {
  const [open, setOpen] = useState(false)
  const st = REGISTRY_STATUS[e.statut]
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-b last:border-0">
      <div className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold">{e.numero}</span>
            <TypeTag type={e.dossier.type} />
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", st.tone)}>{st.label}</span>
          </div>
          <div className="mt-1 truncate font-heading font-semibold">{e.titre}</div>
          <div className="truncate text-xs text-muted-foreground">
            {e.titulaire} · {e.dossier.province} · délivré le {fmtDate(e.delivreLe)}
            {e.validiteFin && ` · valide jusqu’au ${fmtDate(e.validiteFin)}`}
          </div>
          {e.dossier.decision?.retrait && <div className="mt-1 text-xs text-rose-600">Retiré le {fmtDate(e.dossier.decision.retrait.le)} — {e.dossier.decision.retrait.motif}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {e.historique.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
              {e.historique.length} acte(s) <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href={`/documents/${e.dossier.id}?doc=decision`} target="_blank"><FileText /> Titre</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dossiers/${e.dossier.id}`}>Dossier</Link>
          </Button>
          {e.statut !== "retiree" && canRetire(user, e.dossier) && <RetraitDialog e={e} />}
        </div>
      </div>
      {open && (
        <div className="mx-4 mb-3 space-y-1.5 rounded-xl bg-muted/50 p-3">
          {e.historique.map((h) => (
            <Link key={h.dossier.id} href={`/dossiers/${h.dossier.id}`} className="flex items-center gap-2 text-xs hover:text-brand-green">
              <span className="font-mono font-semibold">{h.dossier.decision?.numero}</span>
              <span>{h.label}</span>
              <span className="ml-auto text-muted-foreground">{fmtDate(h.dossier.decision?.signeLe)}</span>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function RegistresPage() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const [mod, setMod] = useState<ModuleId | "all">("all")
  const [q, setQ] = useState("")
  const registry = useMemo(() => buildRegistry(all.filter((d) => canSee(user, d))), [all, user])
  const rows = registry.filter(
    (e) => (mod === "all" || e.module === mod) && (!q || [e.numero, e.titre, e.titulaire, e.dossier.details?.dci ?? ""].join(" ").toLowerCase().includes(q.toLowerCase()))
  )
  const count = (m: ModuleId) => registry.filter((e) => e.module === m && e.statut !== "retiree").length

  return (
    <>
      <PageHeader
        eyebrow="Résultats / délivrables"
        title="Registres réglementaires"
        description="Titres délivrés par l’ACOREP : établissements autorisés, produits enregistrés, AMM, autres autorisations. Renouvellements, modifications et retraits y sont rattachés."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMod(mod === m.id ? "all" : m.id)}
            className={cn("card-elevated relative overflow-hidden p-4 text-left transition-all hover:-translate-y-0.5", mod === m.id && "ring-2 ring-brand-green")}
          >
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: m.color }} />
            <div className="font-heading text-3xl font-bold">{count(m.id)}</div>
            <div className="mt-1 text-xs leading-snug font-medium">{m.deliverable}</div>
          </button>
        ))}
      </div>
      <div className="card-elevated overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(x) => setQ(x.target.value)} placeholder="N° de titre, produit, DCI, titulaire…" className="h-9 rounded-xl pl-9" />
          </div>
          <span className="text-xs text-muted-foreground">
            {rows.length} titre(s){mod !== "all" && ` · ${MODULES.find((m) => m.id === mod)?.short}`} · retrait réservé : {ROLES.dg.short} (national), {ROLES.directeur.short} (provincial)
          </span>
        </div>
        {rows.length ? rows.map((e, i) => <Row key={e.dossier.id} e={e} user={user} i={i} />) : <div className="p-6"><Empty icon={Library} title="Aucun titre" text="Aucun titre délivré dans ce périmètre." /></div>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sources : décisions signées et positives — avis et PV de constat, licences, enregistrements, AMM (avec variations et renouvellements), autorisations médicales, importations.</p>
    </>
  )
}
