"use client"

import { procDef, subjectTitle } from "@/lib/procedures"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Inbox, Sparkles } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { canSee, needsMyAction, stagesFor } from "@/lib/workflow"
import { ROLES, categoryById } from "@/lib/referentiels"
import { computeSla, fromNow } from "@/lib/dates"
import type { Dossier } from "@/lib/types"
import { DossierId, Empty, PageHeader, SlaRing, StatusBadge, TypeTag } from "@/components/platform/bits"

function nextStep(d: Dossier) {
  const def = procDef(d.type)
  switch (d.status) {
    case "depose": return "Enregistrer au registre et orienter"
    case "recevabilite": return "Contrôler la recevabilité"
    case "paiement": return "Traiter le paiement"
    case "evaluation": return `${def.evaluation?.label} (${Object.keys(d.evaluation?.axes ?? {}).length}/${def.evaluation?.axes.length})`
    case "inspection": return d.mission ? "Réaliser l’inspection" : def.inspectionOptionnelle ? "Planifier ou dispenser l’inspection" : "Planifier l’inspection"
    case "cpop": return `Rendre l’avis — ${def.commission?.label}`
    case "projet": return "Rédiger le projet de décision"
    case "signature": return "Signer et notifier la décision"
    case "notifie": return "Classer et archiver le dossier"
    default: return ""
  }
}

function QueueCard({ d, i }: { d: Dossier; i: number }) {
  const sla = computeSla(d)
  const stage = stagesFor(d).find((s) => s.id === d.status)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <Link href={`/dossiers/${d.id}`} className="card-elevated group flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-green/40 md:flex-row md:items-center">
        <SlaRing dossier={d} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <DossierId id={d.id} />
            <TypeTag type={d.type} />
            <StatusBadge status={d.status} />
            {sla.level === "danger" && <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold text-rose-600">Urgent</span>}
          </div>
          <div className="mt-1.5 truncate font-heading text-base font-semibold">{subjectTitle(d)}</div>
          <div className="text-xs text-muted-foreground">
            {categoryById(d.categorie).label} · {d.etablissement.commune}, {d.province} · reçu {fromNow(d.receivedAt)}
          </div>
        </div>
        <div className="flex items-center gap-3 md:text-right">
          <div>
            <div className="text-[10px] tracking-wider text-muted-foreground uppercase">Prochaine étape</div>
            <div className="text-sm font-semibold text-brand-navy dark:text-sky-300">{nextStep(d) || stage?.hint}</div>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-brand-green text-white transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function WorkQueuePage() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const queue = all
    .filter((d) => needsMyAction(user, d))
    .sort((a, b) => computeSla(a).remaining - computeSla(b).remaining)
  const watch = all.filter((d) => canSee(user, d) && !needsMyAction(user, d) && !["archive"].includes(d.status)).length

  return (
    <>
      <PageHeader
        eyebrow={ROLES[user.role].label}
        title="File de travail"
        description={`Dossiers qui requièrent votre action, triés par urgence de délai. ${watch} autre(s) dossier(s) en cours dans votre périmètre.`}
      />
      {user.role === "dg" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
          <Sparkles className="size-4 shrink-0 text-brand-green" /> La Direction générale signe les décisions des procédures nationales (produits, AMM, importation, vigilance) et supervise les provinces.
        </div>
      )}
      {queue.length === 0 ? (
        <Empty icon={Inbox} title="Tout est à jour" text="Aucun dossier n’attend votre action. Changez de profil pour faire avancer le circuit." />
      ) : (
        <div className="space-y-3">
          {queue.map((d, i) => (
            <QueueCard key={d.id} d={d} i={i} />
          ))}
        </div>
      )}
    </>
  )
}
