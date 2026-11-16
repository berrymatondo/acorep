"use client"

import Link from "next/link"
import { CircleCheck, CircleX, CirclePause, FileText, MapPin, Minus, ShieldCheck, Camera, Link2, TriangleAlert, FlaskConical, Ban, SkipForward } from "lucide-react"
import type { Dossier } from "@/lib/types"
import { useRims } from "@/lib/store"
import { PIECE_TYPES, ROLES, categoryById, moduleById } from "@/lib/referentiels"
import { checklistFor, grilleFor, outcomeOf, procDef, requiredPieces } from "@/lib/procedures"
import { actorName } from "@/lib/workflow"
import { computeSla, fmtDate, fmtDateTime } from "@/lib/dates"
import { Empty, Hash, StatusBadge } from "@/components/platform/bits"
import { fmtSize } from "@/components/platform/file-drop"
import { cn } from "@/lib/utils"

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-medium whitespace-pre-line", mono && "font-mono text-[13px]")}>{children || "—"}</dd>
    </div>
  )
}

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5", className)}>
      <h3 className="mb-4 font-heading text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

export function OverviewTab({ d }: { d: Dossier }) {
  const def = procDef(d.type)
  const cat = categoryById(d.categorie)
  const sla = computeSla(d)
  const mod = moduleById(def.module)
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {def.fields && d.details && (
        <Block title={def.categoryGroup === "produit" ? "Produit et objet de la demande" : "Informations spécifiques"} className="md:col-span-2">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {def.fields.map((f) => (
              <div key={f.id} className={cn(f.type === "textarea" && "sm:col-span-2 lg:col-span-3")}>
                <Field label={f.label}>{d.details?.[f.id]}</Field>
              </div>
            ))}
          </dl>
        </Block>
      )}
      <Block title={def.subject.bloc}>
        <dl className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label={def.subject.nom}>{d.etablissement.nom}</Field></div>
          <Field label="Catégorie">
            <span className="flex items-center gap-2"><span className="size-2 rounded-sm" style={{ background: mod.color }} />{cat.label}</span>
          </Field>
          <Field label="Référentiel">{cat.bp}</Field>
          <div className="col-span-2"><Field label={def.subject.adresse}>{d.etablissement.adresse}, {d.etablissement.commune} — {d.province}</Field></div>
        </dl>
      </Block>
      <Block title={`Demandeur & ${def.subject.responsable.toLowerCase()}`}>
        <dl className="grid grid-cols-2 gap-4">
          <Field label="Demandeur / promoteur">{d.promoteur.nom}</Field>
          <Field label="Téléphone" mono>{d.promoteur.telephone}</Field>
          <Field label={def.subject.responsable}>{d.pharmacien.nom}</Field>
          <Field label={def.subject.numero} mono>{d.pharmacien.numeroOrdre}</Field>
          <div className="col-span-2"><Field label="Courriel">{d.promoteur.email}</Field></div>
        </dl>
      </Block>
      <Block title="Enregistrement">
        <dl className="grid grid-cols-2 gap-4">
          <Field label="Module">{mod.short}</Field>
          <Field label="Niveau de traitement">{def.niveau === "central" ? "Niveau central (DG)" : `Province de ${d.province}`}</Field>
          <Field label="Reçu le">{fmtDateTime(d.receivedAt)}</Field>
          <Field label="Accusé de réception" mono>{d.accuseRef}</Field>
          <Field label="Instructeur">{d.assigneeId ? actorName(d.assigneeId) : "—"}</Field>
          {d.parentId && (
            <Field label={def.parent?.label ?? "Dossier de référence"}>
              <Link href={`/dossiers/${d.parentId}`} className="inline-flex items-center gap-1 font-mono text-brand-green hover:underline">
                <Link2 className="size-3.5" /> {d.parentId}
              </Link>
            </Field>
          )}
        </dl>
      </Block>
      <Block title="Délais réglementaires">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Jours ouvrables consommés</span>
            <span className="font-mono font-semibold">{sla.consumed} / {sla.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${sla.ratio * 100}%` }} />
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Échéance de notification</span>
            <span className="font-medium">{fmtDate(sla.deadline)}</span>
          </div>
          {d.suspensions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {d.suspensions.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs">
                  <CirclePause className="size-3.5 text-amber-600" />
                  {s.motif} · {fmtDate(s.debut)} → {s.fin ? fmtDate(s.fin) : "en cours"}
                </div>
              ))}
            </div>
          )}
        </div>
      </Block>
    </div>
  )
}

export function PiecesTab({ d }: { d: Dossier }) {
  const req = requiredPieces(d.type, d.categorie)
  const missing = req.filter((r) => !d.pieces.some((p) => p.typeId === r.id))
  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-sm">
          <TriangleAlert className="size-4 text-amber-600" /> Pièces exigibles manquantes : {missing.map((m) => m.label).join(", ")}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wider text-muted-foreground uppercase">
              <th className="px-4 py-2.5 font-medium">Pièce</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Version</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Déposé</th>
              <th className="px-4 py-2.5 font-medium">Empreinte</th>
            </tr>
          </thead>
          <tbody>
            {d.pieces.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-navy/8 text-brand-navy dark:text-sky-300"><FileText className="size-4" /></span>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{PIECE_TYPES.find((t) => t.id === p.typeId)?.label ?? "Pièce complémentaire"}</div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">{p.nom} · {fmtSize(p.taille)}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell"><span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">v{p.version}</span></td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">{fmtDate(p.deposeLe)}<br />{actorName(p.deposePar)}</td>
                <td className="px-4 py-3"><Hash value={p.hash} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-brand-green" /> Chaque pièce est horodatée, versionnée et scellée par une empreinte SHA-256 ; toute altération est détectable.</p>
    </div>
  )
}

function Mark({ v }: { v: string | null | undefined }) {
  if (v === "ok" || v === "conforme" || v === "favorable") return <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-brand-green"><CircleCheck className="size-4" /> {v === "favorable" ? "Favorable" : "Conforme"}</span>
  if (v === "ko" || v === "non_conforme" || v === "defavorable") return <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-rose-600"><CircleX className="size-4" /> {v === "defavorable" ? "Défavorable" : "Non conforme"}</span>
  if (v === "a_corriger" || v === "reserves") return <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-amber-600"><TriangleAlert className="size-4" /> {v === "reserves" ? "Avec réserves" : "À corriger"}</span>
  if (v === "na") return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Minus className="size-4" /> N/A</span>
  return <span className="text-xs whitespace-nowrap text-muted-foreground">À contrôler</span>
}

export function RecevabiliteTab({ d }: { d: Dossier }) {
  return (
    <div className="space-y-4">
      <Block title="Liste de contrôle de recevabilité">
        <div className="divide-y">
          {checklistFor(d.type).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              {c.label}
              <Mark v={d.checklist[c.id]} />
            </div>
          ))}
        </div>
      </Block>
      {d.complementsDemandes && (
        <Block title="Dernière demande de compléments">
          <p className="text-sm">{d.complementsDemandes}</p>
        </Block>
      )}
    </div>
  )
}

export function PaiementTab({ d }: { d: Dossier }) {
  const p = d.paiement
  if (!p?.inviteLe) return <Empty icon={FileText} title="Pas encore d’invitation à payer" text="Elle est émise par la cellule financière après validation de la recevabilité." />
  const steps = [
    { label: "Invitation à payer émise", at: p.inviteLe },
    { label: "Justificatif déposé", at: p.preuve ? "ok" : undefined, extra: p.preuve },
    { label: "Paiement validé", at: p.valideLe },
  ]
  return (
    <Block title={`Redevance ${p.reference} — ${p.montant.toLocaleString("fr-FR")} $`}>
      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span className={cn("grid size-7 place-items-center rounded-full", s.at ? "bg-brand-green text-white" : "bg-muted text-muted-foreground")}>
              <CircleCheck className="size-4" />
            </span>
            <span className="flex-1">{s.label}{s.extra && <span className="ml-2 font-mono text-xs text-muted-foreground">{s.extra}</span>}</span>
            <span className="text-xs text-muted-foreground">{s.at && s.at !== "ok" ? fmtDateTime(s.at) : ""}</span>
          </li>
        ))}
      </ol>
    </Block>
  )
}

export function EvaluationTab({ d }: { d: Dossier }) {
  const ev = procDef(d.type).evaluation
  if (!ev) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-green/12 text-brand-green"><FlaskConical className="size-5" /></span>
        <div className="flex-1">
          <div className="font-heading font-semibold">{ev.label}</div>
          <div className="text-xs text-muted-foreground">{ev.hint} · {ROLES[ev.role].label}</div>
        </div>
        {d.evaluation?.clotureLe ? <span className="text-xs font-semibold text-brand-green">Clôturée le {fmtDate(d.evaluation.clotureLe)}</span> : <span className="text-xs text-muted-foreground">En cours</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ev.axes.map((a) => {
          const r = d.evaluation?.axes[a.id]
          return (
            <div key={a.id} className={cn("rounded-2xl border bg-card p-4", !r && "border-dashed")}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold">{a.label}</div>
                <Mark v={r?.conclusion} />
              </div>
              {r ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{r.rapport}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{actorName(r.par)} · {fmtDateTime(r.le)}</p>
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Rapport attendu.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function InspectionTab({ d }: { d: Dossier }) {
  if (d.inspectionDispensee)
    return (
      <Block title="Inspection non requise">
        <div className="flex gap-3 text-sm">
          <SkipForward className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p>{d.inspectionDispensee.motif}</p>
            <p className="mt-1 text-xs text-muted-foreground">Dispense décidée par {actorName(d.inspectionDispensee.par)} le {fmtDate(d.inspectionDispensee.le)}</p>
          </div>
        </div>
      </Block>
    )
  if (!d.mission) return <Empty icon={Camera} title="Aucune mission planifiée" text="L’ordre de mission est émis par le bureau instructeur." />
  const i = d.inspection
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Block title="Mission" className="md:col-span-1">
        <dl className="space-y-3">
          <Field label="Ordre de mission" mono>{d.mission.ordre}</Field>
          <Field label="Date de visite">{fmtDate(d.mission.date, "EEEE d MMMM yyyy")}</Field>
          <Field label="Équipe">{d.mission.inspecteurs.map(actorName).join(", ")}</Field>
          {i && (
            <>
              <Field label="Preuves"><span className="flex items-center gap-1.5"><Camera className="size-3.5" /> {i.photos} photo(s)</span></Field>
              <Field label="Géolocalisation" mono>{i.gps ? <span className="flex items-center gap-1"><MapPin className="size-3.5 text-brand-green" />{i.gps.lat.toFixed(5)}, {i.gps.lng.toFixed(5)}</span> : "—"}</Field>
              <Field label="PV">{i.signeLe ? `Version ${i.pvVersion} signée le ${fmtDate(i.signeLe)}` : "Brouillon"}</Field>
            </>
          )}
        </dl>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {i?.signature && <img src={i.signature} alt="Signature de l’inspecteur" className="mt-4 h-16 rounded-lg border bg-white p-1" />}
      </Block>
      <Block title="Grille de visite" className="md:col-span-2">
        {i ? (
          <>
            <div className="divide-y">
              {grilleFor(d.type).map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    {g.label}
                    {i.grille[g.id]?.obs && <div className="text-xs text-muted-foreground">{i.grille[g.id].obs}</div>}
                  </div>
                  <Mark v={i.grille[g.id]?.v} />
                </div>
              ))}
            </div>
            {i.observations && <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm"><b>Observations :</b> {i.observations}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Visite non encore réalisée.</p>
        )}
      </Block>
    </div>
  )
}

export function DecisionTab({ d }: { d: Dossier }) {
  const def = procDef(d.type)
  const out = outcomeOf(d)
  if (!d.cpop && !d.decision) return <Empty icon={ShieldCheck} title="Aucune décision à ce stade" text="Les avis et le projet de décision motivée apparaîtront ici." />
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {d.cpop && (
        <Block title={def.commission?.label ?? "Avis collégial"}>
          <div className={cn("mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase", d.cpop.avis === "favorable" ? "bg-accent text-accent-foreground" : "bg-rose-500/12 text-rose-600")}>{d.cpop.avis}</div>
          <p className="text-sm">{d.cpop.motif}</p>
          <p className="mt-2 text-xs text-muted-foreground">{actorName(d.cpop.par)} · {fmtDateTime(d.cpop.le)}</p>
        </Block>
      )}
      {d.decision && (
        <Block title="Décision motivée">
          <div className={cn("mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase", out?.positive ? "bg-accent text-accent-foreground" : "bg-rose-500/12 text-rose-600")}>{out?.label}</div>
          <p className="text-sm">{d.decision.motivation}</p>
          <div className="mt-4 space-y-1.5">
            {d.decision.visas.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <CircleCheck className="size-3.5 text-brand-green" /> {ROLES[v.role].short} — {actorName(v.par)} · {fmtDateTime(v.le)}
              </div>
            ))}
          </div>
          {d.decision.codeVerif && (
            <div className="mt-4 space-y-1 rounded-xl border border-dashed p-3 text-xs">
              {d.decision.numero && <div>N° de décision : <span className="font-mono font-bold">{d.decision.numero}</span></div>}
              <div>Code de vérification : <span className="font-mono font-bold tracking-wider">{d.decision.codeVerif}</span></div>
              {d.decision.validiteFin && <div>Valide jusqu’au <b>{fmtDate(d.decision.validiteFin)}</b></div>}
              {d.notification && <div className="text-muted-foreground">Envoyé {fmtDateTime(d.notification.envoyeLe)} · {d.notification.recuLe ? `reçu ${fmtDateTime(d.notification.recuLe)}` : "réception non confirmée"}</div>}
            </div>
          )}
          {d.decision.retrait && (
            <div className="mt-3 flex gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              <Ban className="size-4 shrink-0" />
              <div><b>Retirée le {fmtDate(d.decision.retrait.le)}</b> par {actorName(d.decision.retrait.par)} — {d.decision.retrait.motif}</div>
            </div>
          )}
        </Block>
      )}
    </div>
  )
}

export function AuditTab({ d }: { d: Dossier }) {
  const events = useRims((s) => s.events).filter((e) => e.dossierId === d.id)
  return (
    <div className="relative rounded-2xl border bg-card p-5">
      <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-border">
        {events.map((e) => (
          <li key={e.id} className="relative pl-9">
            <span className="absolute top-1 left-0 grid size-[23px] place-items-center rounded-full border-2 border-brand-green bg-card">
              <span className="size-2 rounded-full bg-brand-green" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{e.action}</span>
              {e.to && <StatusBadge status={e.to} />}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {actorName(e.actorId)} · {ROLES[e.role].label} · {fmtDateTime(e.at)}
            </div>
            {e.comment && <div className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs italic">« {e.comment} »</div>}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>préc.</span> <Hash value={e.prevHash} n={8} /> <span>→</span> <Hash value={e.hash} n={8} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
