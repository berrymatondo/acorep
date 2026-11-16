"use client"

import { subjectTitle } from "@/lib/procedures"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, CalendarDays, CircleCheck, MapPin, Radar, Users } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { actorName, canSee } from "@/lib/workflow"
import { fmtDate } from "@/lib/dates"
import { categoryById } from "@/lib/referentiels"
import type { Dossier } from "@/lib/types"
import { DossierId, Empty, PageHeader, StatusBadge, TypeTag } from "@/components/platform/bits"
import { cn } from "@/lib/utils"

function MissionCard({ d, i, mine }: { d: Dossier; i: number; mine: boolean }) {
  const date = d.mission ? new Date(d.mission.date) : null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <Link href={d.mission && !d.inspection?.signeLe ? `/inspections/${d.id}` : `/dossiers/${d.id}`} className={cn("card-elevated group flex gap-4 p-4 transition-all hover:-translate-y-0.5", mine && "ring-2 ring-brand-green/40")}>
        <div className={cn("flex w-16 shrink-0 flex-col items-center justify-center rounded-xl py-2", date ? "bg-brand-navy text-white dark:bg-sky-400/15 dark:text-sky-200" : "border border-dashed text-muted-foreground")}>
          {date ? (
            <>
              <span className="text-[10px] uppercase opacity-70">{fmtDate(date, "MMM")}</span>
              <span className="font-heading text-2xl leading-none font-bold">{fmtDate(date, "d")}</span>
              <span className="text-[10px] opacity-70">{fmtDate(date, "EEE")}</span>
            </>
          ) : (
            <CalendarDays className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <DossierId id={d.id} />
            <TypeTag type={d.type} />
            {d.inspection?.signeLe ? <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-green"><CircleCheck className="size-3.5" /> PV signé</span> : <StatusBadge status={d.status} />}
          </div>
          <div className="mt-1 truncate font-heading font-semibold">{subjectTitle(d)}</div>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3" />{d.etablissement.commune}</span>
            <span>{categoryById(d.categorie).bp}</span>
            {d.mission && <span className="flex items-center gap-1"><Users className="size-3" />{d.mission.inspecteurs.map((x) => actorName(x).split(" ").slice(-1)).join(", ")}</span>}
          </div>
        </div>
        <ArrowRight className="size-4 self-center text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  )
}

function Col({ title, items, hint, userId }: { title: string; items: Dossier[]; hint: string; userId: string }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading font-semibold">{title} <span className="font-mono text-xs text-muted-foreground">{items.length}</span></h2>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="space-y-3">
        {items.length ? items.map((d, i) => <MissionCard key={d.id} d={d} i={i} mine={!!d.mission?.inspecteurs.includes(userId)} />) : <Empty icon={Radar} title="Rien ici" />}
      </div>
    </section>
  )
}

export default function InspectionsPage() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers).filter((d) => canSee(user, d))
  const toPlan = all.filter((d) => d.status === "inspection" && !d.mission)
  const planned = all.filter((d) => d.status === "inspection" && d.mission).sort((a, b) => a.mission!.date.localeCompare(b.mission!.date))
  const done = all.filter((d) => d.inspection?.signeLe).sort((a, b) => b.inspection!.signeLe!.localeCompare(a.inspection!.signeLe!)).slice(0, 6)

  return (
    <>
      <PageHeader eyebrow="Évaluation & inspections" title="Missions d’inspection" description="Planification des visites, grille annexe 04, preuves géolocalisées et procès-verbaux signés." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Col title="À planifier" items={toPlan} hint="Paiement validé" userId={user.id} />
        <Col title="Programmées" items={planned} hint="Ordre de mission émis" userId={user.id} />
        <Col title="PV signés récents" items={done} hint="Derniers 6" userId={user.id} />
      </div>
    </>
  )
}
