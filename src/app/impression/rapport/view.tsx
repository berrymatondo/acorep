"use client"

import Link from "next/link"
import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dossier, Status } from "@/lib/types"
import { useCurrentUser, useHydrated, useNow, useRims } from "@/lib/store"
import { MODULES, ROLES, STATUS_META, moduleById } from "@/lib/referentiels"
import { DELAIS, PROCEDURE_DEFS, procDef, stageLabel, subjectTitle, outcomeOf } from "@/lib/procedures"
import { computeSla, fmtDate, fmtDateTime } from "@/lib/dates"
import { buildRegistry, REGISTRY_STATUS, type RegistryStatus } from "@/lib/registres"
import { PERIODES, RAPPORTS, dossiersFor, fromQuery, type RapportParams } from "@/lib/rapports"
import { sha256 } from "@/lib/sha256"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

const CLOSED: Status[] = ["notifie", "archive"]
const enCours = (d: Dossier) => !CLOSED.includes(d.status)

/** Regroupement des états pour les tableaux transverses. */
const PHASES: { label: string; states: Status[] }[] = [
  { label: "Réception", states: ["depose", "recevabilite"] },
  { label: "Compl.", states: ["complements"] },
  { label: "Paiement", states: ["paiement"] },
  { label: "Évaluation", states: ["evaluation"] },
  { label: "Inspection", states: ["inspection"] },
  { label: "Avis", states: ["cpop"] },
  { label: "Décision", states: ["projet", "signature"] },
  { label: "Clos", states: ["notifie", "archive"] },
]

function Report() {
  const sp = useSearchParams()
  const hydrated = useHydrated()
  const user = useCurrentUser()
  const all = useRims((s) => s.dossiers)
  const now = useNow()
  const p = fromQuery(sp)
  const autoPrint = sp.get("print") === "1"

  useEffect(() => {
    if (!hydrated || !autoPrint) return
    const t = setTimeout(() => window.print(), 500)
    return () => clearTimeout(t)
  }, [hydrated, autoPrint])

  if (!hydrated) return null

  const rows = dossiersFor(user, all, p, now)
  const meta = RAPPORTS[p.type]
  const ref = `RAP-${sha256(JSON.stringify(p) + user.id + new Date(now).toDateString()).slice(0, 8).toUpperCase()}`
  const perimetre = [
    p.type === "procedure" ? procDef(p.procedure).label : p.module === "all" ? "Tous les modules" : moduleById(p.module).label,
    p.province === "all" ? (user.province ?? "Toutes les provinces") : p.province,
    PERIODES[p.periode],
  ]

  return (
    <div className="min-h-screen bg-muted/60 py-10 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm 12mm 16mm; }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/rapports"><ArrowLeft /> Rapports</Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-xl bg-brand-navy text-white">
          <Printer /> Imprimer / PDF
        </Button>
      </div>

      <article className="relative mx-auto max-w-[210mm] bg-white p-[14mm] text-[12px] leading-relaxed text-slate-900 shadow-2xl print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-brand-navy pb-4">
          <div className="flex items-center gap-3">
            <LogoMark className="size-12" />
            <div>
              <div className="font-heading text-xl font-extrabold text-brand-navy">A<span className="text-brand-green">C</span>OREP</div>
              <div className="text-[9.5px] tracking-wider text-slate-500 uppercase">Autorité Congolaise de Réglementation Pharmaceutique</div>
              <div className="text-[9.5px] text-slate-500">{user.province ? `Direction provinciale — ${user.province}` : "Direction générale — Kinshasa"}</div>
            </div>
          </div>
          <div className="text-right text-[10.5px] text-slate-500">
            <div className="font-mono font-semibold text-slate-800">{ref}</div>
            <div>Édité le {fmtDateTime(new Date(now))}</div>
            <div>par {user.nom} ({ROLES[user.role].short})</div>
          </div>
        </header>

        <h1 className="mt-7 font-heading text-[22px] leading-tight font-bold text-brand-navy">{meta.titre}</h1>
        <p className="mt-1 text-slate-600">{meta.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {perimetre.map((x) => (
            <span key={x} className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[10.5px] text-slate-700">{x}</span>
          ))}
          <span className="rounded-full bg-brand-navy px-2.5 py-0.5 text-[10.5px] font-semibold text-white">{rows.length} dossier{rows.length > 1 ? "s" : ""}</span>
        </div>

        {rows.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">Aucun dossier ne correspond à ce périmètre.</p>
        ) : p.type === "activite" ? (
          <Activite rows={rows} p={p} />
        ) : p.type === "delais" ? (
          <Delais rows={rows} now={now} />
        ) : p.type === "decisions" ? (
          <Decisions rows={rows} now={now} />
        ) : (
          <Procedure rows={rows} p={p} now={now} />
        )}

        <footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-3 text-[9.5px] text-slate-500">
          <span>RIMS · ACOREP — Données de démonstration, fictives.</span>
          <span>Délais en jours ouvrables. Seul le délai de l’avis d’implantation provient de la POS AQ-POS-ENR-001-26.</span>
        </footer>
      </article>
    </div>
  )
}

/* ───────────────────────── Briques ───────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid-page">
      <h2 className="mb-2.5 border-l-4 border-brand-green pl-2 font-heading text-[14px] font-bold text-brand-navy">{title}</h2>
      {children}
    </section>
  )
}

function Kpis({ items }: { items: { label: string; value: React.ReactNode; tone?: string }[] }) {
  return (
    <div className="mt-6 grid grid-cols-4 gap-2.5 break-inside-avoid">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg border border-slate-200 p-3">
          <div className={cn("font-heading text-[22px] leading-none font-bold", k.tone ?? "text-brand-navy")}>{k.value}</div>
          <div className="mt-1.5 text-[10px] text-slate-500">{k.label}</div>
        </div>
      ))}
    </div>
  )
}

function Table({ head, children, right = [] }: { head: string[]; children: React.ReactNode; right?: number[] }) {
  return (
    <table className="w-full border-collapse text-[10.5px]">
      <thead>
        <tr className="bg-slate-100 text-left text-[9.5px] tracking-wide text-slate-600 uppercase">
          {head.map((h, i) => (
            <th key={h} className={cn("border-b border-slate-300 px-2 py-1.5 font-semibold", right.includes(i) && "text-right")}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="[&_td]:border-b [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1.5 [&_tr]:break-inside-avoid">{children}</tbody>
    </table>
  )
}

function Bar({ value, max, color = "var(--brand-navy)" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 print:[print-color-adjust:exact]">
      <div className="h-full rounded-full print:[print-color-adjust:exact]" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
    </div>
  )
}

const cell = (n: number) => (n ? n : <span className="text-slate-300">·</span>)

/* ───────────────────────── Rapports ───────────────────────── */

function Activite({ rows, p }: { rows: Dossier[]; p: RapportParams }) {
  const signed = rows.filter((d) => d.decision?.signeLe)
  const fav = signed.filter((d) => outcomeOf(d)?.positive).length
  const procs = PROCEDURE_DEFS.filter((x) => p.module === "all" || x.module === p.module)
  const byProv = Object.entries(rows.reduce<Record<string, number>>((a, d) => ((a[d.province] = (a[d.province] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1])
  const maxProv = Math.max(...byProv.map((x) => x[1]))
  return (
    <>
      <Kpis
        items={[
          { label: "Dossiers déposés", value: rows.length },
          { label: "En instruction", value: rows.filter(enCours).length },
          { label: "En attente de compléments", value: rows.filter((d) => d.status === "complements").length, tone: "text-amber-600" },
          { label: `Décisions signées (${fav} favorables)`, value: signed.length, tone: "text-brand-green" },
        ]}
      />
      <Section title="Dossiers par procédure et par état">
        <Table head={["Procédure", ...PHASES.map((x) => x.label), "Total"]} right={PHASES.map((_, i) => i + 1).concat(PHASES.length + 1)}>
          {procs.map((x) => {
            const r = rows.filter((d) => d.type === x.id)
            if (!r.length) return null
            return (
              <tr key={x.id}>
                <td>
                  <span className="mr-1.5 inline-block size-2 rounded-full print:[print-color-adjust:exact]" style={{ background: moduleById(x.module).color }} />
                  {x.label}
                </td>
                {PHASES.map((ph) => (
                  <td key={ph.label} className="text-right font-mono">{cell(r.filter((d) => ph.states.includes(d.status)).length)}</td>
                ))}
                <td className="text-right font-mono font-bold">{r.length}</td>
              </tr>
            )
          })}
          <tr className="font-semibold">
            <td>Total</td>
            {PHASES.map((ph) => (
              <td key={ph.label} className="text-right font-mono">{rows.filter((d) => ph.states.includes(d.status)).length}</td>
            ))}
            <td className="text-right font-mono">{rows.length}</td>
          </tr>
        </Table>
      </Section>
      <div className="grid grid-cols-2 gap-6">
        <Section title="Répartition par province">
          <div className="space-y-1.5">
            {byProv.map(([prov, n]) => (
              <div key={prov} className="grid grid-cols-[110px_1fr_28px] items-center gap-2">
                <span className="truncate">{prov}</span>
                <Bar value={n} max={maxProv} />
                <span className="text-right font-mono">{n}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Répartition par module">
          <div className="space-y-1.5">
            {MODULES.map((m) => {
              const n = rows.filter((d) => procDef(d.type).module === m.id).length
              if (!n) return null
              return (
                <div key={m.id} className="grid grid-cols-[110px_1fr_28px] items-center gap-2">
                  <span className="truncate">{m.short}</span>
                  <Bar value={n} max={rows.length} color={m.color} />
                  <span className="text-right font-mono">{n}</span>
                </div>
              )
            })}
          </div>
        </Section>
      </div>
      {signed.length > 0 && <DecisionsTable rows={signed} />}
    </>
  )
}

function Delais({ rows, now }: { rows: Dossier[]; now: number }) {
  const open = rows.filter((d) => enCours(d) && d.receivedAt).map((d) => ({ d, s: computeSla(d, new Date(now)) }))
  const critique = open.filter((x) => x.s.level === "danger").length
  const moy = open.length ? Math.round(open.reduce((a, x) => a + x.s.ratio, 0) / open.length * 100) : 0
  const susp = open.filter((x) => x.s.suspended > 0).length
  const procs = PROCEDURE_DEFS.filter((x) => open.some((o) => o.d.type === x.id))
  return (
    <>
      <Kpis
        items={[
          { label: "Dossiers en cours (reçus)", value: open.length },
          { label: "Délai consommé en moyenne", value: `${moy} %` },
          { label: "Délai critique (≥ 85 %)", value: critique, tone: critique ? "text-rose-600" : undefined },
          { label: "Avec suspension (compléments)", value: susp, tone: "text-amber-600" },
        ]}
      />
      <Section title="Respect des délais par procédure">
        <Table head={["Procédure", "Délai cible", "En cours", "Dans les temps", "Vigilance", "Critique"]} right={[1, 2, 3, 4, 5]}>
          {procs.map((x) => {
            const r = open.filter((o) => o.d.type === x.id)
            return (
              <tr key={x.id}>
                <td>{x.label}</td>
                <td className="text-right font-mono">{DELAIS[x.id]} j.o.</td>
                <td className="text-right font-mono">{r.length}</td>
                <td className="text-right font-mono text-emerald-700">{cell(r.filter((o) => o.s.level === "ok").length)}</td>
                <td className="text-right font-mono text-amber-600">{cell(r.filter((o) => o.s.level === "warn").length)}</td>
                <td className="text-right font-mono font-semibold text-rose-600">{cell(r.filter((o) => o.s.level === "danger").length)}</td>
              </tr>
            )
          })}
        </Table>
      </Section>
      <Section title="Dossiers en cours, par urgence">
        <Table head={["Dossier", "Procédure", "Objet", "État", "Consommé", "Restant", "Échéance"]} right={[4, 5]}>
          {open
            .sort((a, b) => a.s.remaining - b.s.remaining)
            .map(({ d, s }) => (
              <tr key={d.id}>
                <td className="font-mono font-semibold whitespace-nowrap">{d.id}</td>
                <td>{procDef(d.type).short}</td>
                <td className="max-w-[48mm] truncate">{subjectTitle(d)}</td>
                <td className="whitespace-nowrap">{STATUS_META[d.status].label}</td>
                <td className="text-right font-mono whitespace-nowrap">{s.consumed} / {s.total}{s.suspended ? ` (+${s.suspended} susp.)` : ""}</td>
                <td className={cn("text-right font-mono font-semibold", s.level === "danger" ? "text-rose-600" : s.level === "warn" ? "text-amber-600" : "text-emerald-700")}>{s.remaining}</td>
                <td className="whitespace-nowrap">{fmtDate(s.deadline)}</td>
              </tr>
            ))}
        </Table>
      </Section>
    </>
  )
}

function DecisionsTable({ rows }: { rows: Dossier[] }) {
  return (
    <Section title="Décisions signées">
      <Table head={["Signée le", "N° du titre", "Procédure", "Objet", "Issue"]}>
        {[...rows]
          .sort((a, b) => b.decision!.signeLe!.localeCompare(a.decision!.signeLe!))
          .map((d) => {
            const o = outcomeOf(d)
            return (
              <tr key={d.id}>
                <td className="whitespace-nowrap">{fmtDate(d.decision!.signeLe)}</td>
                <td className="font-mono whitespace-nowrap">{d.decision!.numero ?? d.id}</td>
                <td>{procDef(d.type).short}</td>
                <td className="max-w-[60mm] truncate">{subjectTitle(d)}</td>
                <td className={cn("font-medium", o?.positive ? "text-emerald-700" : "text-rose-600")}>{o?.label ?? "—"}</td>
              </tr>
            )
          })}
      </Table>
    </Section>
  )
}

function Decisions({ rows, now }: { rows: Dossier[]; now: number }) {
  const signed = rows.filter((d) => d.decision?.signeLe)
  const fav = signed.filter((d) => outcomeOf(d)?.positive).length
  const registry = buildRegistry(rows, now)
  const statuts = Object.keys(REGISTRY_STATUS) as RegistryStatus[]
  return (
    <>
      <Kpis
        items={[
          { label: "Décisions signées", value: signed.length },
          { label: "Favorables", value: fav, tone: "text-brand-green" },
          { label: "Défavorables / mesures restrictives", value: signed.length - fav, tone: "text-rose-600" },
          { label: "Titres au registre", value: registry.length },
        ]}
      />
      {signed.length > 0 ? <DecisionsTable rows={signed} /> : <p className="mt-6 text-slate-500">Aucune décision signée sur ce périmètre.</p>}
      {registry.length > 0 && (
        <Section title="Titres délivrés et validité">
          <div className="mb-3 flex flex-wrap gap-4 text-[11px]">
            {statuts.map((s) => (
              <span key={s}>
                {REGISTRY_STATUS[s].label} : <b>{registry.filter((e) => e.statut === s).length}</b>
              </span>
            ))}
          </div>
          <Table head={["N° du titre", "Titre", "Titulaire", "Délivré le", "Valide jusqu’au", "Statut"]}>
            {registry.map((e) => (
              <tr key={e.numero}>
                <td className="font-mono whitespace-nowrap">{e.numero}</td>
                <td className="max-w-[45mm] truncate">{e.titre}</td>
                <td className="max-w-[40mm] truncate">{e.titulaire}</td>
                <td className="whitespace-nowrap">{fmtDate(e.delivreLe)}</td>
                <td className="whitespace-nowrap">{e.validiteFin ? fmtDate(e.validiteFin) : "—"}</td>
                <td className={cn("font-medium", e.statut === "retiree" ? "text-rose-600" : e.statut === "a_renouveler" ? "text-amber-600" : e.statut === "expiree" ? "text-slate-500" : "text-emerald-700")}>
                  {REGISTRY_STATUS[e.statut].label}
                  {e.dossier.decision?.retrait ? ` — ${e.dossier.decision.retrait.motif}` : ""}
                </td>
              </tr>
            ))}
          </Table>
        </Section>
      )}
    </>
  )
}

function Procedure({ rows, p, now }: { rows: Dossier[]; p: RapportParams; now: number }) {
  const def = procDef(p.procedure)
  const states: Status[] = def.stages.includes("recevabilite") ? [...def.stages.slice(0, 2), "complements", ...def.stages.slice(2)] : def.stages
  const max = Math.max(1, ...states.map((s) => rows.filter((d) => d.status === s).length))
  return (
    <>
      <Kpis
        items={[
          { label: "Dossiers", value: rows.length },
          { label: "En instruction", value: rows.filter(enCours).length },
          { label: "Délai cible", value: `${DELAIS[def.id]} j.o.` },
          { label: "Signataire", value: ROLES[def.signataire].short },
        ]}
      />
      <Section title="Dossiers par état du circuit">
        <div className="space-y-1.5">
          {states.map((s, i) => {
            const n = rows.filter((d) => d.status === s).length
            return (
              <div key={s} className="grid grid-cols-[22px_150px_1fr_28px] items-center gap-2">
                <span className="text-right font-mono text-[10px] text-slate-400">{s === "complements" ? "↺" : states.filter((x) => x !== "complements").indexOf(s) + 1}</span>
                <span className={cn(s === "complements" && "text-amber-700 italic")}>{stageLabel(def.id, s).label}</span>
                <Bar value={n} max={max} color={s === "complements" ? "#f59e0b" : i >= states.length - 2 ? "var(--brand-green)" : "var(--brand-navy)"} />
                <span className="text-right font-mono font-semibold">{n}</span>
              </div>
            )
          })}
        </div>
      </Section>
      <Section title="Liste détaillée des dossiers">
        <Table head={["Dossier", "Objet", "Province", "Déposé le", "État", "Délai"]} right={[5]}>
          {[...rows]
            .sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt))
            .map((d) => {
              const s = computeSla(d, new Date(now))
              return (
                <tr key={d.id}>
                  <td className="font-mono font-semibold whitespace-nowrap">{d.id}</td>
                  <td className="max-w-[55mm] truncate">{subjectTitle(d)}</td>
                  <td>{d.province}</td>
                  <td className="whitespace-nowrap">{fmtDate(d.submittedAt)}</td>
                  <td className="whitespace-nowrap">{STATUS_META[d.status].label}</td>
                  <td className="text-right font-mono whitespace-nowrap">{s.level === "na" ? "—" : s.level === "done" ? `${s.consumed} j (clos)` : `${s.remaining} j restants`}</td>
                </tr>
              )
            })}
        </Table>
      </Section>
    </>
  )
}

export default function RapportView() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  )
}
