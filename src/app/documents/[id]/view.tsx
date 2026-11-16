"use client"

import { Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Printer } from "lucide-react"
import { useHydrated, useRims } from "@/lib/store"
import { categoryById } from "@/lib/referentiels"
import { DELAIS, PROCEDURES, grilleFor, outcomeOf, procDef, subjectTitle } from "@/lib/procedures"
import { actorName } from "@/lib/workflow"
import { fmtDate, fmtDateTime } from "@/lib/dates"
import { sha256 } from "@/lib/sha256"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

const TITLES: Record<string, string> = {
  accuse: "Accusé de réception",
  invitation: "Invitation à payer",
  ordre: "Ordre de mission",
  pv: "Procès-verbal de visite des lieux",
  evaluation: "Rapport d’évaluation",
  decision: "Décision",
}

function Doc() {
  const { id } = useParams<{ id: string }>()
  const kind = useSearchParams().get("doc") ?? "accuse"
  const hydrated = useHydrated()
  const d = useRims((s) => s.dossiers.find((x) => x.id === id))
  if (!hydrated) return null
  if (!d) return <p className="p-10 text-center">Document introuvable.</p>

  const def = procDef(d.type)
  const out = outcomeOf(d)
  const title = kind === "decision" ? def.documentTitle(d.decision?.issue) : TITLES[kind]
  const code = kind === "decision" && d.decision?.codeVerif ? d.decision.codeVerif : sha256(d.id + kind).slice(0, 12).toUpperCase()
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/verifier?code=${code}` : ""
  const cat = categoryById(d.categorie)

  return (
    <div className="min-h-screen bg-muted/60 py-10 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end px-4">
        <Button onClick={() => window.print()} className="rounded-xl bg-brand-navy text-white"><Printer /> Imprimer / PDF</Button>
      </div>
      <article className="relative mx-auto min-h-[297mm] max-w-[210mm] overflow-hidden bg-white p-[18mm] text-[13px] leading-relaxed text-slate-900 shadow-2xl print:shadow-none">
        <div className="pointer-events-none absolute inset-0 bg-guilloche opacity-40" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="-rotate-30 font-heading text-[64px] font-black tracking-widest whitespace-nowrap text-slate-900/5">DÉMONSTRATION · FICTIF</span>
        </div>
        <header className="relative flex items-start justify-between border-b-2 border-brand-navy pb-5">
          <div className="flex items-center gap-3">
            <LogoMark className="size-14" />
            <div>
              <div className="font-heading text-2xl font-extrabold text-brand-navy">A<span className="text-brand-green">C</span>OREP</div>
              <div className="text-[10px] tracking-wider text-slate-500 uppercase">Autorité Congolaise de Réglementation Pharmaceutique</div>
              <div className="text-[10px] text-slate-500">{def.niveau === "central" ? "Direction générale — Kinshasa" : `Direction provinciale — ${d.province}`}</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div className="font-mono font-semibold text-slate-800">{d.id}</div>
            <div>{kind === "decision" && d.decision?.numero ? d.decision.numero : kind === "accuse" ? d.accuseRef : kind === "invitation" ? d.paiement?.reference : kind === "ordre" ? d.mission?.ordre : `Réf. ${code}`}</div>
            <div>Émis le {fmtDate(kind === "decision" ? d.decision?.signeLe : kind === "pv" ? d.inspection?.signeLe : kind === "evaluation" ? d.evaluation?.clotureLe : kind === "ordre" ? d.mission?.date : kind === "invitation" ? d.paiement?.inviteLe : d.receivedAt)}</div>
          </div>
        </header>

        <h1 className="relative mt-10 text-center font-heading text-2xl font-bold tracking-tight text-brand-navy uppercase">{title}</h1>
        <p className="relative mt-1 text-center text-xs text-slate-500">{PROCEDURES[d.type].label}{def.module === "etablissements" ? " — POS AQ-POS-ENR-001-26" : ""}</p>

        <section className="relative mt-8 grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-slate-200 bg-white/80 p-4 text-[12px]">
          {d.details?.nomCommercial || d.details?.produitSuspect ? <div className="col-span-2"><span className="text-slate-500">Objet :</span> <b>{subjectTitle(d)}</b>{d.details.dci ? ` — ${d.details.dci}, ${d.details.forme ?? ""}` : ""}</div> : null}
          <div><span className="text-slate-500">{def.subject.nom} :</span> <b>{d.etablissement.nom}</b></div>
          <div><span className="text-slate-500">Catégorie :</span> {cat.label}</div>
          <div className="col-span-2"><span className="text-slate-500">Adresse :</span> {d.etablissement.adresse}, {d.etablissement.commune}, {d.province}</div>
          <div><span className="text-slate-500">Promoteur :</span> {d.promoteur.nom}</div>
          <div><span className="text-slate-500">{def.subject.responsable} :</span> {d.pharmacien.nom} ({d.pharmacien.numeroOrdre})</div>
        </section>

        <section className="relative mt-6 space-y-3">
          {kind === "accuse" && (
            <>
              <p>L’ACOREP accuse réception de la demande désignée ci-dessus, déposée en ligne le <b>{fmtDateTime(d.receivedAt)}</b> et enregistrée au registre sous le numéro <b>{d.id}</b>.</p>
              <p>Conformément à la procédure, la décision sera notifiée au plus tard dans un délai de <b>{DELAIS[d.type]} jours ouvrables</b> à compter de cette réception, hors suspensions justifiées.</p>
              <p>Pièces reçues : {d.pieces.length}. Chaque pièce est scellée par empreinte SHA-256.</p>
            </>
          )}
          {kind === "invitation" && (
            <>
              <p>Le demandeur est invité à s’acquitter de la redevance relative à l’instruction de sa demande :</p>
              <div className="my-4 rounded-lg border-2 border-brand-navy/20 p-4 text-center"><div className="text-xs text-slate-500">Montant (indicatif)</div><div className="font-heading text-3xl font-bold">{d.paiement?.montant.toLocaleString("fr-FR")} USD</div><div className="font-mono text-xs">Réf. {d.paiement?.reference}</div></div>
              <p>La poursuite de l’instruction est subordonnée à la validation du paiement par la cellule financière.</p>
            </>
          )}
          {kind === "ordre" && d.mission && (
            <>
              <p>Il est ordonné aux inspecteurs ci-après de procéder à la visite des lieux de l’établissement désigné, le <b>{fmtDate(d.mission.date, "EEEE d MMMM yyyy")}</b> :</p>
              <ul className="list-disc pl-6">{d.mission.inspecteurs.map((i) => <li key={i}>{actorName(i)}</li>)}</ul>
              <p>La visite sera conduite selon la grille de l’annexe 04 et les bonnes pratiques applicables ({cat.bp}).</p>
            </>
          )}
          {kind === "pv" && d.inspection && (
            <>
              <p>Visite réalisée le {fmtDate(d.inspection.signeLe)} — position {d.inspection.gps?.lat.toFixed(5)}, {d.inspection.gps?.lng.toFixed(5)} — {d.inspection.photos} photos jointes. PV version {d.inspection.pvVersion}.</p>
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {grilleFor(d.type).map((g) => (
                    <tr key={g.id} className="border-b border-slate-200">
                      <td className="py-1.5">{g.label}</td>
                      <td className="py-1.5 text-right font-semibold">{({ conforme: "Conforme", a_corriger: "À corriger", non_conforme: "Non conforme" } as Record<string, string>)[d.inspection!.grille[g.id]?.v ?? ""] ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p><b>Observations :</b> {d.inspection.observations || "—"}</p>
            </>
          )}
          {kind === "evaluation" && def.evaluation && (
            <>
              <p>{def.evaluation.label} — {def.evaluation.hint}. Clôturée le {fmtDate(d.evaluation?.clotureLe)}.</p>
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {def.evaluation.axes.map((a) => {
                    const r = d.evaluation?.axes[a.id]
                    return (
                      <tr key={a.id} className="border-b border-slate-200 align-top">
                        <td className="py-2 pr-3 font-semibold">{a.label}</td>
                        <td className="py-2 pr-3">{r?.rapport ?? "—"}<div className="text-[10px] text-slate-500">{r ? `${actorName(r.par)} · ${fmtDate(r.le)}` : ""}</div></td>
                        <td className="py-2 text-right font-semibold whitespace-nowrap">{({ favorable: "Favorable", reserves: "Avec réserves", defavorable: "Défavorable" } as Record<string, string>)[r?.conclusion ?? ""] ?? "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
          {kind === "decision" && d.decision && (
            <>
              <p>
                <b>Vu</b> la demande enregistrée sous le n° {d.id}
                {d.evaluation?.clotureLe ? ` ; vu les conclusions de l’${def.evaluation?.label.toLowerCase()}` : ""}
                {d.inspection?.signeLe ? " ; vu le procès-verbal de visite" : d.inspectionDispensee ? " ; vu la dispense d’inspection motivée" : ""}
                {d.cpop ? ` ; vu l’avis ${d.cpop.avis} (${def.commission?.label}) du ${fmtDate(d.cpop.le)}` : ""} ;
              </p>
              <p className="rounded-lg bg-slate-50 p-4 italic">{d.decision.motivation}</p>
              <p className="text-center font-heading text-lg font-bold">
                Décision : <span className={out?.positive ? "text-brand-green" : "text-rose-600"}>{out?.label}</span>
              </p>
              {d.decision.validiteFin && <p className="text-center text-sm">Valable jusqu’au <b>{fmtDate(d.decision.validiteFin)}</b>{def.id.startsWith("amm") || def.id === "enregistrement_produit" ? ", renouvelable sur demande." : "."}</p>}
              {d.decision.retrait && <p className="rounded-lg border-2 border-rose-500 p-3 text-center font-bold text-rose-600">RETIRÉE le {fmtDate(d.decision.retrait.le)} — {d.decision.retrait.motif}</p>}
              {d.type === "pv_constat" && <p className="text-xs text-slate-500">Le présent PV de constat ne vaut pas, à lui seul, autorisation d’ouverture.</p>}
              {d.type === "avis_implantation" && out?.positive && <p className="text-xs text-slate-500">La demande de PV de constat des lieux doit intervenir dans les 90 jours suivant la notification.</p>}
              {d.type === "amm_nouveau" && out?.positive && <p className="text-xs text-slate-500">Toute modification des éléments de l’AMM doit faire l’objet d’une demande de variation préalable.</p>}
            </>
          )}
        </section>

        <footer className="absolute right-[18mm] bottom-[18mm] left-[18mm] flex items-end justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            <QRCodeSVG value={verifyUrl} size={84} fgColor="#0b3a66" />
            <div className="text-[10px] text-slate-500">
              <div className="font-semibold text-slate-700">Document vérifiable</div>
              <div>Code : <span className="font-mono font-bold tracking-wider text-slate-800">{code}</span></div>
              <div>Scannez ou saisissez le code sur /verifier</div>
            </div>
          </div>
          <div className="text-right text-[11px]">
            {kind === "decision" && d.decision?.signePar ? (
              <>
                <div className="text-slate-500">Signé électroniquement par</div>
                <div className="font-semibold">{actorName(d.decision.signePar)}</div>
                <div className="text-slate-500">{def.signataire === "dg" ? "Direction générale" : "Directeur provincial"} · {fmtDateTime(d.decision.signeLe)}</div>
              </>
            ) : kind === "pv" && d.inspection?.signature ? (
              <img src={d.inspection.signature} alt="Signature" className="ml-auto h-14" />
            ) : (
              <div className="text-slate-500">Généré par ACOREP-RIMS<br />{fmtDateTime(new Date())}</div>
            )}
          </div>
        </footer>
      </article>
    </div>
  )
}

export default function DocumentPage() {
  return (
    <Suspense>
      <Doc />
    </Suspense>
  )
}
