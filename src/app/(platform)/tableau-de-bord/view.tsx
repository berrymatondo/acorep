"use client"

import Link from "next/link"
import { useMemo } from "react"
import { motion } from "motion/react"
import {
  ArrowRight, ArrowUpRight, CalendarDays, CirclePause, FileText, Hourglass, Inbox, Plus, Radar, ShieldCheck, Stamp, TriangleAlert,
} from "lucide-react"
import { useCurrentUser, useNow, useRims } from "@/lib/store"
import { canSee, needsMyAction, ownerRole, progress, actorName } from "@/lib/workflow"
import { computeSla, fmtDate, fromNow } from "@/lib/dates"
import { ROLES } from "@/lib/referentiels"
import { PROCEDURES, isPositive, subjectSubtitle, subjectTitle } from "@/lib/procedures"
import type { Dossier } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DossierId, PageHeader, SlaRing, StatusBadge, TypeTag } from "@/components/platform/bits"
import { AnimatedNumber } from "@/components/platform/animated-number"
import { ModuleBar, FlowChart, PipelineBars, ProvinceBars } from "@/components/platform/charts"
import { cn } from "@/lib/utils"

function Greeting({ name, queue, subtitle, cta }: { name: string; queue: number; subtitle: string; cta: React.ReactNode }) {
  const h = new Date().getHours()
  const hello = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 overflow-hidden rounded-3xl bg-brand-deep p-6 text-white md:p-8"
    >
      <div className="absolute inset-0 bg-guilloche opacity-60" />
      <div className="absolute -top-20 -right-10 size-80 rounded-full bg-brand-green/30 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60">
            <CalendarDays className="size-3.5" />
            {fmtDate(new Date(), "EEEE d MMMM yyyy")}
          </div>
          <h1 className="text-2xl font-bold md:text-4xl">
            {hello}, {name.split(" ").slice(-2).join(" ")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            {queue > 0 ? (
              <>
                <span className="font-semibold text-brand-lime">{queue} dossier{queue > 1 ? "s" : ""}</span> attend{queue > 1 ? "ent" : ""} votre action. {subtitle}
              </>
            ) : (
              <>Aucune action en attente de votre part. {subtitle}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">{cta}</div>
      </div>
    </motion.div>
  )
}

function Kpi({ icon: Icon, label, value, hint, accent, href }: { icon: React.ElementType; label: string; value: number; hint: string; accent: string; href: string }) {
  return (
    <Link href={href} className="card-elevated group relative overflow-hidden p-5 transition-transform hover:-translate-y-0.5">
      <div className={cn("absolute -top-8 -right-8 size-24 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30", accent)} />
      <div className="flex items-start justify-between">
        <div className={cn("grid size-10 place-items-center rounded-xl text-white", accent)}>
          <Icon className="size-[18px]" />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-4 font-heading text-3xl font-bold tabular-nums">
        <AnimatedNumber value={value} />
      </div>
      <div className="mt-0.5 text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </Link>
  )
}

function AgentDashboard() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const events = useRims((s) => s.events)
  const dossiers = useMemo(() => all.filter((d) => canSee(user, d)), [all, user])
  const ids = useMemo(() => new Set(dossiers.map((d) => d.id)), [dossiers])
  const myEvents = useMemo(() => events.filter((e) => ids.has(e.dossierId)), [events, ids])
  const queue = dossiers.filter((d) => needsMyAction(user, d))
  const enCours = dossiers.filter((d) => !["archive", "notifie"].includes(d.status))
  const complements = dossiers.filter((d) => d.status === "complements")
  const inspections = dossiers.filter((d) => d.status === "inspection" && d.mission)
  const echeances = enCours
    .map((d) => ({ d, sla: computeSla(d) }))
    .filter((x) => x.sla.level === "danger" || x.sla.level === "warn")
    .sort((a, b) => a.sla.remaining - b.sla.remaining)
  const notified = dossiers.filter((d) => d.notification)
  const inTime = notified.filter((d) => computeSla(d).consumed <= 60)
  const avg = notified.length ? notified.reduce((a, d) => a + computeSla(d).consumed, 0) / notified.length : 0
  const rate = notified.length ? (inTime.length / notified.length) * 100 : 0

  return (
    <>
      <Greeting
        name={user.nom}
        queue={queue.length}
        subtitle={`${ROLES[user.role].label} — ${user.province ?? "vue nationale, toutes provinces"}.`}
        cta={
          <>
            <Button asChild size="lg" className="h-10 rounded-xl bg-brand-green px-4 text-white hover:bg-brand-green/90">
              <Link href="/travail">
                <Inbox /> Ma file de travail
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 rounded-xl border-white/20 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white">
              <Link href="/dossiers">Consulter les dossiers</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="Dossiers en cours" value={enCours.length} hint={`${dossiers.length} au total dans votre périmètre`} accent="bg-brand-navy" href="/dossiers" />
        <Kpi icon={CirclePause} label="À compléter" value={complements.length} hint="Délai suspendu, attente du demandeur" accent="bg-amber-500" href="/dossiers?statut=complements" />
        <Kpi icon={Radar} label="Inspections programmées" value={inspections.length} hint={`${dossiers.filter((d) => d.status === "inspection" && !d.mission).length} mission(s) à planifier`} accent="bg-cyan-600" href="/inspections" />
        <Kpi icon={TriangleAlert} label="Échéances proches" value={echeances.length} hint="≥ 60 % du délai de 60 j.o. consommé" accent="bg-rose-500" href="/dossiers?tri=delai" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card-elevated p-5 xl:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">Flux réglementaire</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Dépôts reçus et décisions notifiées par semaine</p>
          <FlowChart events={myEvents} />
        </section>
        <section className="card-elevated relative overflow-hidden p-5">
          <h2 className="font-heading text-base font-semibold">Respect des délais POS</h2>
          <p className="text-xs text-muted-foreground">Avis notifiés sous 60 jours ouvrables</p>
          <div className="mt-6 flex items-end gap-2">
            <span className="font-heading text-6xl font-bold tracking-tighter text-brand-navy dark:text-sky-300">
              <AnimatedNumber value={rate} suffix=" %" />
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {inTime.length} sur {notified.length} décisions notifiées dans le délai
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="text-[11px] text-muted-foreground">Délai moyen</div>
              <div className="font-heading text-xl font-bold">
                <AnimatedNumber value={avg} decimals={1} /> <span className="text-xs font-normal text-muted-foreground">j.o.</span>
              </div>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="text-[11px] text-muted-foreground">Suspensions</div>
              <div className="font-heading text-xl font-bold">
                <AnimatedNumber value={dossiers.reduce((a, d) => a + d.suspensions.length, 0)} />
              </div>
            </div>
          </div>
          <ShieldCheck className="absolute -right-6 -bottom-6 size-36 text-brand-green/8" />
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card-elevated p-5">
          <h2 className="font-heading text-base font-semibold">Dossiers par étape</h2>
          <p className="mb-4 text-xs text-muted-foreground">Cliquez une étape pour filtrer</p>
          <PipelineBars dossiers={dossiers} />
        </section>
        <section className="card-elevated p-5">
          <h2 className="font-heading text-base font-semibold">Échéances à surveiller</h2>
          <p className="mb-4 text-xs text-muted-foreground">Triées par jours ouvrables restants</p>
          <div className="space-y-1">
            {echeances.slice(0, 6).map(({ d }) => (
              <Link key={d.id} href={`/dossiers/${d.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/70">
                <SlaRing dossier={d} size={38} />
                <div className="min-w-0 flex-1">
                  <DossierId id={d.id} />
                  <div className="truncate text-xs text-muted-foreground">{subjectTitle(d)}</div>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
            {echeances.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Aucune échéance critique 🎉</p>}
          </div>
        </section>
        <section className="card-elevated p-5">
          {user.role === "dg" ? (
            <>
              <h2 className="font-heading text-base font-semibold">Activité par province</h2>
              <p className="mb-4 text-xs text-muted-foreground">Supervision nationale</p>
              <ProvinceBars dossiers={dossiers} />
            </>
          ) : (
            <>
              <h2 className="font-heading text-base font-semibold">Dossiers par module</h2>
              <p className="mb-4 text-xs text-muted-foreground">Répartition des {dossiers.length} dossiers RIMS</p>
              <ModuleBar dossiers={dossiers} />
            </>
          )}
        </section>
      </div>

      <section className="card-elevated mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold">Activité récente</h2>
            <p className="text-xs text-muted-foreground">Extrait du journal d’audit chaîné</p>
          </div>
          {["bureau", "directeur", "dg"].includes(user.role) && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/audit">
                Journal complet <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {myEvents
            .slice(-10)
            .reverse()
            .map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 border-b border-dashed py-2.5 last:border-0"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-green ring-4 ring-brand-green/15" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Link href={`/dossiers/${e.dossierId}`} className="font-mono text-xs font-semibold hover:text-brand-green">
                      {e.dossierId}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">{fromNow(e.at)}</span>
                  </div>
                  <div className="truncate text-[13px]">{e.action}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {actorName(e.actorId)} · {ROLES[e.role].short}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </section>
    </>
  )
}

function ApplicantCard({ d }: { d: Dossier }) {
  const role = ownerRole(d)
  const mine = role === "demandeur"
  return (
    <Link href={`/dossiers/${d.id}`} className="card-elevated group relative block overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl">
      {mine && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TypeTag type={d.type} />
            <DossierId id={d.id} className="text-muted-foreground" />
          </div>
          <h3 className="mt-2 font-heading text-lg leading-tight font-semibold">{subjectTitle(d)}</h3>
          <p className="text-xs text-muted-foreground">{subjectSubtitle(d)}</p>
        </div>
        <SlaRing dossier={d} />
      </div>
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <StatusBadge status={d.status} />
          <span className="font-mono text-muted-foreground">{progress(d)} %</span>
        </div>
        <Progress value={progress(d)} className="h-1.5" />
      </div>
      {mine && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <Hourglass className="size-3.5" /> Action attendue de votre part
          <ArrowRight className="ml-auto size-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      )}
    </Link>
  )
}

function ApplicantDashboard() {
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const dossiers = all.filter((d) => canSee(user, d))
  const actions = dossiers.filter((d) => ownerRole(d) === "demandeur")
  const now = useNow()
  const DAY = 86400000
  const suggestions: { key: string; text: React.ReactNode; href: string; cta: string }[] = []
  dossiers.forEach((d) => {
    if (!d.decision?.signeLe || !isPositive(d) || d.decision.retrait) return
    const children = dossiers.filter((x) => x.parentId === d.id)
    if (d.type === "avis_implantation" && !children.length && now - new Date(d.notification!.envoyeLe).getTime() < 90 * DAY)
      suggestions.push({ key: d.id + "pv", href: `/nouvelle-demande?type=pv_constat&parent=${d.id}`, cta: "Demander le PV", text: <><b>Avis favorable {d.id}</b> — demandez le PV de constat des lieux avant le <b>{fmtDate(new Date(new Date(d.notification!.envoyeLe).getTime() + 90 * DAY))}</b> (90 jours).</> })
    if (d.type === "amm_nouveau") {
      const renew = d.decision.validiteFin && new Date(d.decision.validiteFin).getTime() - now < 365 * DAY
      if (renew && !children.some((c) => c.type === "amm_renouvellement"))
        suggestions.push({ key: d.id + "ren", href: `/nouvelle-demande?type=amm_renouvellement&parent=${d.id}`, cta: "Renouveler l’AMM", text: <><b>AMM {subjectTitle(d)}</b> — expire le <b>{fmtDate(d.decision.validiteFin)}</b>. Déposez la demande de renouvellement.</> })
      else suggestions.push({ key: d.id + "var", href: `/nouvelle-demande?type=amm_variation&parent=${d.id}`, cta: "Déclarer une variation", text: <><b>AMM {subjectTitle(d)}</b> en vigueur — toute modification doit faire l’objet d’une variation.</> })
    }
  })
  return (
    <>
      <Greeting
        name={user.nom}
        queue={actions.length}
        subtitle="Suivez vos demandes en temps réel et recevez vos documents vérifiables."
        cta={
          <Button asChild size="lg" className="h-10 rounded-xl bg-brand-green px-4 text-white hover:bg-brand-green/90">
            <Link href="/nouvelle-demande">
              <Plus /> Nouvelle demande
            </Link>
          </Button>
        }
      />
      {suggestions.map((sg) => (
        <div key={sg.key} className="mb-3 flex flex-col gap-3 rounded-2xl border border-brand-green/30 bg-accent/60 p-4 sm:flex-row sm:items-center">
          <Stamp className="size-5 shrink-0 text-brand-green" />
          <div className="flex-1 text-sm">{sg.text}</div>
          <Button asChild size="sm" className="bg-brand-green text-white">
            <Link href={sg.href}>{sg.cta}</Link>
          </Button>
        </div>
      ))}
      <PageHeader eyebrow="Portail demandeur" title="Mes dossiers" description={`${dossiers.length} dossier(s) — ${[...new Set(dossiers.map((d) => PROCEDURES[d.type].label))].join(", ")}.`} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dossiers.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ApplicantCard d={d} />
          </motion.div>
        ))}
      </div>
    </>
  )
}

export default function DashboardPage() {
  const user = useCurrentUser()
  return user.role === "demandeur" ? <ApplicantDashboard /> : <AgentDashboard />
}
