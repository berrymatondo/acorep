"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight, ArrowUpRight, BookOpen, Download, BookOpenCheck, Boxes, Check, CircleHelp, FileText, FolderOpen, History, Home,
  Inbox, LayoutDashboard, Library, Lightbulb, Map, MonitorSmartphone, Plus, Printer, QrCode, Radar, Search, Users, Workflow, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/store"
import { MODULES, ROLES, STATUS_META, moduleById } from "@/lib/referentiels"
import { DELAIS, PROCEDURE_DEFS } from "@/lib/procedures"
import { STAGES } from "@/lib/workflow"
import { DOC_FAQ, DOC_PAGES, DOC_SHELL, type DocAccess, type DocPage } from "@/lib/documentation"
import type { Role } from "@/lib/types"
import { PageHeader, StatusBadge } from "@/components/platform/bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ICONS: Record<string, React.ElementType> = {
  home: Home, dashboard: LayoutDashboard, inbox: Inbox, boxes: Boxes, folder: FolderOpen, file: FileText, plus: Plus,
  radar: Radar, map: Map, library: Library, history: History, book: BookOpenCheck, printer: Printer, qr: QrCode,
}

const GROUPES: DocPage["groupe"][] = ["Accueil", "Pilotage", "Instruction", "Contrôle", "Public"]

const DEMO = [
  { qui: "Demandeur", quoi: "Dépose une demande depuis « Nouvelle demande » ; le dossier reçoit son numéro ACR-AAAA-NNNN." },
  { qui: "Secrétariat", quoi: "Accuse réception et oriente le dossier vers un agent instructeur." },
  { qui: "Bureau", quoi: "Contrôle la recevabilité ou demande des compléments (délai suspendu)." },
  { qui: "Finances", quoi: "Émet l’invitation à payer puis valide le justificatif du demandeur." },
  { qui: "Expert / Inspecteur", quoi: "Évalue le dossier critère par critère, ou réalise la visite et signe le PV sur le terrain." },
  { qui: "CPOP / Commission", quoi: "Rend l’avis collégial motivé." },
  { qui: "Bureau", quoi: "Rédige le projet de décision et choisit l’issue." },
  { qui: "Directeur / DG", quoi: "Signe après contrôle automatique des prérequis (code OTP simulé) ; le titre est numéroté." },
  { qui: "Demandeur → Secrétariat", quoi: "Accusé de réception de la décision, puis archivage. Le titre rejoint les registres." },
]

function searchable(p: DocPage) {
  return [p.titre, p.route, p.resume, ...p.fonctionnalites.flatMap((f) => [f.titre, ...f.points]), ...(p.astuces ?? [])].join(" ").toLowerCase()
}

function AccessBadges({ acces, role }: { acces: DocAccess; role: Role }) {
  if (acces === "public") return <Pill tone="green">Public · sans connexion</Pill>
  if (acces === "tous") return <Pill tone="green">Tous les profils</Pill>
  return (
    <div className="flex flex-wrap gap-1">
      {acces.map((r) => (
        <Pill key={r} tone={r === role ? "navy" : "muted"}>{ROLES[r].short}</Pill>
      ))}
    </div>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "green" | "navy" | "muted" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "green" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        tone === "navy" && "bg-brand-navy text-white dark:bg-sky-400 dark:text-slate-950",
        tone === "muted" && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function Section({ id, icon: Icon, eyebrow, title, children }: { id: string; icon: React.ElementType; eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} data-doc-section className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-navy text-white dark:bg-sky-400/15 dark:text-sky-300">
          <Icon className="size-5" />
        </span>
        <div>
          {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green">{eyebrow}</div>}
          <h2 className="font-heading text-xl font-bold">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function PageDoc({ p, role }: { p: DocPage; role: Role }) {
  const Icon = ICONS[p.icon] ?? FileText
  const allowed = p.acces === "tous" || p.acces === "public" || p.acces.includes(role)
  return (
    <article id={p.id} data-doc-section className="card-elevated scroll-mt-24 overflow-hidden">
      <header className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-start">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 text-white shadow-md">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg font-bold">{p.titre}</h3>
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{p.route}</code>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{p.resume}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Accès</span>
            <AccessBadges acces={p.acces} role={role} />
          </div>
        </div>
        {p.href && (
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl" disabled={!allowed}>
            <Link href={p.href}>
              Ouvrir <ArrowUpRight />
            </Link>
          </Button>
        )}
      </header>
      <div className="grid gap-px bg-border lg:grid-cols-2">
        {p.fonctionnalites.map((f, i) => (
          <div key={f.titre} className={cn("bg-card p-5", p.fonctionnalites.length % 2 === 1 && i === p.fonctionnalites.length - 1 && "lg:col-span-2")}>
            <h4 className="mb-2.5 text-sm font-semibold">{f.titre}</h4>
            <ul className="space-y-2">
              {f.points.map((pt) => (
                <li key={pt} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {(p.astuces?.length || p.exigences?.length) && (
        <footer className="flex flex-col gap-3 border-t bg-muted/30 p-4 text-xs md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {p.astuces?.map((a) => (
              <p key={a} className="flex gap-2 text-muted-foreground">
                <Lightbulb className="size-4 shrink-0 text-amber-500" /> {a}
              </p>
            ))}
          </div>
          {p.exigences && (
            <div className="flex flex-wrap gap-1 md:justify-end">
              {p.exigences.map((e) => (
                <span key={e} className="rounded-md border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{e}</span>
              ))}
            </div>
          )}
        </footer>
      )}
    </article>
  )
}

export default function DocumentationPage() {
  const user = useCurrentUser()
  const [q, setQ] = useState("")
  const [active, setActive] = useState("prise-en-main")
  const query = q.trim().toLowerCase()
  const pages = useMemo(() => (query ? DOC_PAGES.filter((p) => searchable(p).includes(query)) : DOC_PAGES), [query])
  const faq = query ? DOC_FAQ.filter((f) => (f.q + " " + f.r).toLowerCase().includes(query)) : DOC_FAQ

  const toc = query
    ? [{ groupe: "Résultats", items: pages.map((p) => ({ id: p.id, label: p.titre })) }]
    : [
        { groupe: "Fondamentaux", items: [
          { id: "prise-en-main", label: "Prise en main" },
          { id: "circuit", label: "Circuit d’un dossier" },
          { id: "roles", label: "Rôles et habilitations" },
          { id: "procedures", label: "Modules et procédures" },
          { id: "interface", label: "Interface commune" },
        ] },
        ...GROUPES.map((g) => ({ groupe: g, items: DOC_PAGES.filter((p) => p.groupe === g).map((p) => ({ id: p.id, label: p.titre })) })),
        { groupe: "Aide", items: [{ id: "faq", label: "Questions fréquentes" }] },
      ]

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-doc-section]"))
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-96px 0px -60% 0px" }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [query])

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <>
      <PageHeader
        eyebrow="Aide · Guide d’utilisation"
        title="Documentation"
        description={`Chaque écran du RIMS, ses fonctionnalités et qui peut l’utiliser. ${DOC_PAGES.length} pages décrites, ${PROCEDURE_DEFS.length} procédures, ${Object.keys(ROLES).length} rôles.`}
        actions={
          <Button asChild className="rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90">
            <a href="/docs/guide-plateforme-acorep.pdf" download="Guide de la plateforme ACOREP.pdf">
              <Download /> Guide de la plateforme (PDF)
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1 scrollbar-none">
          <div className="relative mb-4">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une fonction…" className="h-9 rounded-xl pr-8 pl-9" aria-label="Rechercher dans la documentation" />
            {q && (
              <button onClick={() => setQ("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Effacer la recherche">
                <X className="size-4" />
              </button>
            )}
          </div>
          <nav className="hidden space-y-5 lg:block">
            {toc.map((g) => (
              <div key={g.groupe}>
                <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{g.groupe}</div>
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => go(it.id)}
                    className={cn(
                      "relative block w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                      active === it.id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active === it.id && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-brand-green" />}
                    {it.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          {query && (
            <p className="text-sm text-muted-foreground">
              {pages.length + faq.length === 0 ? "Aucun résultat pour" : `${pages.length} page(s) et ${faq.length} question(s) pour`} « {q} ».
            </p>
          )}

          {!query && (
            <>
              <Section id="prise-en-main" icon={BookOpen} eyebrow="Fondamentaux" title="Prise en main">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { t: "1. Choisir un profil", d: "Depuis l’accueil ou le menu profil (en haut à droite). Chaque profil a son rôle, sa province et donc ses écrans et ses actions." },
                    { t: "2. Suivre sa file", d: "Les agents commencent par la File de travail ; le demandeur par son tableau de bord et « Nouvelle demande »." },
                    { t: "3. Agir sur un dossier", d: "Le panneau d’actions de la fiche dossier ne propose que ce que votre profil peut faire à l’étape courante." },
                  ].map((s) => (
                    <div key={s.t} className="card-elevated p-5">
                      <h3 className="font-heading font-semibold">{s.t}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
                    </div>
                  ))}
                </div>
                <div className="card-elevated mt-4 p-5">
                  <h3 className="mb-3 font-heading font-semibold">Parcours type d’un dossier, d’un profil à l’autre</h3>
                  <ol className="space-y-2.5">
                    {DEMO.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-green font-mono text-[11px] font-bold text-white">{i + 1}</span>
                        <span><span className="font-semibold">{s.qui}</span> <span className="text-muted-foreground">— {s.quoi}</span></span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="rounded-xl bg-brand-green text-white hover:bg-brand-green/90">
                      <Link href="/dossiers/ACR-2026-0042">Essayer avec ACR-2026-0042 <ArrowRight /></Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-xl">
                      <Link href="/dossiers/ACR-2026-0081?as=u-exp">AMM en tant qu’expert <ArrowRight /></Link>
                    </Button>
                  </div>
                </div>
              </Section>

              <Section id="circuit" icon={Workflow} eyebrow="Fondamentaux" title="Circuit d’un dossier">
                <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
                  Toutes les procédures partagent ces statuts ; chacune n’utilise que les étapes qui la concernent (par exemple, la vigilance n’a pas
                  d’étape de paiement, le PV de constat pas d’avis collégial). Deux statuts hors circuit : <StatusBadge status="brouillon" /> avant
                  soumission et <StatusBadge status="complements" /> lorsque le délai est suspendu dans l’attente du demandeur.
                </p>
                <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {STAGES.map((s, i) => (
                    <li key={s.id} className="card-elevated relative p-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", STATUS_META[s.id].dot)} />
                        <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-1.5 text-sm font-semibold">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.hint}</div>
                    </li>
                  ))}
                </ol>
              </Section>

              <Section id="roles" icon={Users} eyebrow="Fondamentaux" title="Rôles et habilitations">
                <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
                  Les agents sont rattachés à une province et ne voient que ses dossiers ; le DG et les rôles nationaux voient tout le pays. Votre
                  profil actuel est mis en évidence.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {(Object.entries(ROLES) as [Role, (typeof ROLES)[Role]][]).map(([id, r]) => (
                    <div key={id} className={cn("card-elevated p-4", id === user.role && "ring-2 ring-brand-green")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{r.label}</span>
                        {id === user.role && <Pill tone="green">vous</Pill>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="procedures" icon={Boxes} eyebrow="Fondamentaux" title="Modules et procédures">
                <div className="card-elevated overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 font-semibold">Procédure</th>
                        <th className="px-4 py-2.5 font-semibold">Module</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Délai</th>
                        <th className="px-4 py-2.5 font-semibold">Évaluation · avis</th>
                        <th className="px-4 py-2.5 font-semibold">Signataire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.flatMap((m) =>
                        PROCEDURE_DEFS.filter((p) => p.module === m.id).map((p) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="px-4 py-2.5">
                              <div className="font-medium">{p.label}</div>
                              <div className="text-xs text-muted-foreground">{p.stages.length} étapes{p.parent ? ` · ${p.parent.label}` : ""}{p.inspectionOptionnelle ? " · inspection si nécessaire" : ""}</div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <span className="size-2 rounded-full" style={{ background: moduleById(p.module).color }} />
                                {moduleById(p.module).short}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">{DELAIS[p.id]} j.o.</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">
                              {[p.evaluation && ROLES[p.evaluation.role].short, p.commission && ROLES[p.commission.role].short].filter(Boolean).join(" · ") || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-xs">{ROLES[p.signataire].short}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Seul le délai de 60 j.o. de l’avis d’implantation provient de la POS ; les autres délais sont indicatifs. Détail complet dans Référentiels.</p>
              </Section>

              <Section id="interface" icon={MonitorSmartphone} eyebrow="Fondamentaux" title="Interface commune">
                <div className="grid gap-4 lg:grid-cols-3">
                  {DOC_SHELL.map((f) => (
                    <div key={f.titre} className="card-elevated p-5">
                      <h3 className="mb-2.5 font-heading font-semibold">{f.titre}</h3>
                      <ul className="space-y-2">
                        {f.points.map((pt) => (
                          <li key={pt} className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {(query ? [null] : GROUPES).map((g) => {
            const list = g ? pages.filter((p) => p.groupe === g) : pages
            if (!list.length) return null
            return (
              <div key={g ?? "results"} className="space-y-5">
                {g && (
                  <div className="flex items-center gap-3">
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{g}</h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {list.map((p) => <PageDoc key={p.id} p={p} role={user.role} />)}
              </div>
            )
          })}

          {faq.length > 0 && (
            <Section id="faq" icon={CircleHelp} eyebrow="Aide" title="Questions fréquentes">
              <div className="space-y-2">
                {faq.map((f) => (
                  <details key={f.q} className="card-elevated group p-4 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                      {f.q}
                      <Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
                    </summary>
                    <p className="mt-2 text-sm text-muted-foreground">{f.r}</p>
                  </details>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  )
}
