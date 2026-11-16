"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { BadgeCheck, LoaderCircle, QrCode, ShieldX } from "lucide-react"
import { useRims } from "@/lib/store"
import { PROCEDURES, outcomeOf, subjectTitle } from "@/lib/procedures"
import { fmtDate } from "@/lib/dates"
import { actorName } from "@/lib/workflow"
import { fmtDateTime } from "@/lib/dates"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/platform/bits"

function Verifier() {
  const sp = useSearchParams()
  const dossiers = useRims((s) => s.dossiers)
  const [code, setCode] = useState(sp.get("code") ?? "")
  const [state, setState] = useState<"idle" | "busy" | "done">(sp.get("code") ? "done" : "idle")
  const found = dossiers.find((d) => d.decision?.codeVerif && d.decision.codeVerif === code.trim().toUpperCase())
  const examples = dossiers.filter((d) => d.decision?.codeVerif).slice(0, 3)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Service public" title="Vérifier un document" description="Contrôlez l’authenticité d’un avis ou d’un PV émis par l’ACOREP grâce à son code de vérification ou son QR code." />
      <div className="card-elevated relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-guilloche opacity-50" />
        <form
          className="relative flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault()
            setState("busy")
            await new Promise((r) => setTimeout(r, 900))
            setState("done")
          }}
        >
          <div className="relative flex-1">
            <QrCode className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={code} onChange={(e) => { setCode(e.target.value); setState("idle") }} placeholder="Code à 12 caractères" className="h-12 rounded-xl pl-11 font-mono text-lg tracking-widest uppercase" />
          </div>
          <Button type="submit" className="h-12 rounded-xl bg-brand-navy px-6 text-white" disabled={code.trim().length < 6 || state === "busy"}>
            {state === "busy" ? <LoaderCircle className="animate-spin" /> : "Vérifier"}
          </Button>
        </form>
        {examples.length > 0 && (
          <div className="relative mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            Exemples :
            {examples.map((d) => (
              <button key={d.id} onClick={() => { setCode(d.decision!.codeVerif!); setState("done") }} className="rounded bg-muted px-1.5 font-mono hover:text-foreground">{d.decision!.codeVerif}</button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {state === "done" && (
          <motion.div key={found?.id ?? "none"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            {found ? (
              <div className="card-elevated overflow-hidden">
                {(() => {
                  const retired = !!found.decision!.retrait
                  const expired = !retired && !!found.decision!.validiteFin && new Date(found.decision!.validiteFin) < new Date()
                  return (
                    <div className={`flex items-center gap-4 p-5 text-white ${retired ? "bg-rose-600" : expired ? "bg-amber-600" : "bg-brand-green"}`}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>{retired ? <ShieldX className="size-12" /> : <BadgeCheck className="size-12" />}</motion.div>
                      <div>
                        <div className="font-heading text-xl font-bold">{retired ? "Document authentique — RETIRÉ" : expired ? "Document authentique — EXPIRÉ" : "Document authentique"}</div>
                        <div className="text-sm text-white/85">
                          {retired ? `Décision retirée le ${fmtDate(found.decision!.retrait!.le)} : ${found.decision!.retrait!.motif}` : expired ? `Validité échue le ${fmtDate(found.decision!.validiteFin)}` : "Émis et signé par l’ACOREP — en vigueur"}
                        </div>
                      </div>
                    </div>
                  )
                })()}
                <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Dossier</dt><dd className="font-mono font-semibold">{found.id}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Nature</dt><dd className="font-semibold">{PROCEDURES[found.type].label} — {outcomeOf(found)?.label}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Objet</dt><dd className="font-semibold">{subjectTitle(found)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Titulaire / établissement</dt><dd className="font-semibold">{found.etablissement.nom}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">N° de décision</dt><dd className="font-mono font-semibold">{found.decision!.numero ?? "—"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Validité</dt><dd className="font-semibold">{found.decision!.validiteFin ? `jusqu’au ${fmtDate(found.decision!.validiteFin)}` : "Sans limite"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Province</dt><dd className="font-semibold">{found.province}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Signataire</dt><dd className="font-semibold">{actorName(found.decision!.signePar!)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Signé le</dt><dd className="font-semibold">{fmtDateTime(found.decision!.signeLe)}</dd></div>
                </dl>
                <div className="border-t px-5 py-3 text-xs text-muted-foreground">
                  Données minimales affichées (principe de minimisation). <Link href={`/documents/${found.id}?doc=decision`} className="text-brand-green hover:underline" target="_blank">Voir le document</Link>
                </div>
              </div>
            ) : (
              <div className="card-elevated flex items-center gap-4 border-rose-500/30 p-5">
                <ShieldX className="size-10 text-rose-500" />
                <div>
                  <div className="font-heading font-bold">Aucun document correspondant</div>
                  <div className="text-sm text-muted-foreground">Ce code n’existe pas ou le document a été révoqué. En cas de doute, contactez la direction provinciale.</div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function VerifierPage() {
  return (
    <Suspense>
      <Verifier />
    </Suspense>
  )
}
