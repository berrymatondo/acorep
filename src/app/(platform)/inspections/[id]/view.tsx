"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { ArrowLeft, Camera, CircleCheck, LoaderCircle, Lock, MapPin, Navigation, PenLine, Save, ShieldX, TriangleAlert, CircleX } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { categoryById } from "@/lib/referentiels"
import { grilleFor, nextStatus, procDef, subjectTitle } from "@/lib/procedures"
import { actorName } from "@/lib/workflow"
import { fmtDate } from "@/lib/dates"
import type { GrilleValue } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Empty, DossierId } from "@/components/platform/bits"
import { SignaturePad } from "@/components/platform/signature-pad"
import { cn } from "@/lib/utils"

const OPTIONS: { v: Exclude<GrilleValue, null>; label: string; icon: React.ElementType; cls: string }[] = [
  { v: "conforme", label: "Conforme", icon: CircleCheck, cls: "border-brand-green bg-brand-green text-white" },
  { v: "a_corriger", label: "À corriger", icon: TriangleAlert, cls: "border-amber-500 bg-amber-500 text-white" },
  { v: "non_conforme", label: "Non conforme", icon: CircleX, cls: "border-rose-500 bg-rose-500 text-white" },
]

export default function FieldInspectionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useCurrentUser()
  const d = useRims((s) => s.dossiers.find((x) => x.id === id))
  const act = useRims((s) => s.act)
  const GRILLE = d ? grilleFor(d.type) : []

  const [grille, setGrille] = useState<Record<string, { v: GrilleValue; obs: string }>>(
    () => d?.inspection?.grille ?? Object.fromEntries(GRILLE.map((g) => [g.id, { v: null, obs: "" }]))
  )
  const [obs, setObs] = useState(d?.inspection?.observations ?? "")
  const [photos, setPhotos] = useState<string[]>([])
  const [gps, setGps] = useState(d?.inspection?.gps)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  const filled = GRILLE.filter((g) => grille[g.id]?.v).length
  const nc = GRILLE.filter((g) => grille[g.id]?.v === "non_conforme").length
  const sections = useMemo(() => [...new Set(GRILLE.map((g) => g.section))], [GRILLE])

  if (!d) return <Empty icon={ShieldX} title="Mission introuvable" />
  const assigned = user.role === "inspecteur" && !!d.mission?.inspecteurs.includes(user.id)
  const signed = !!d.inspection?.signeLe
  const editable = assigned && d.status === "inspection" && !signed

  const totalPhotos = (d.inspection?.photos ?? 0) + photos.length

  const save = () => {
    act(d.id, "Visite enregistrée (brouillon de PV)", () => ({
      inspection: { grille, observations: obs, photos: totalPhotos, gps, pvVersion: d.inspection?.pvVersion ?? 1 },
    }))
    toast.success("Visite enregistrée", { description: "Données conservées sans perte, PV en brouillon." })
  }

  const sign = () => {
    const now = new Date().toISOString()
    const next = nextStatus(d, "inspection")
    act(d.id, `Visite réalisée — PV v${d.inspection?.pvVersion ?? 1} signé`, () => ({
      status: next,
      inspection: { grille, observations: obs, photos: totalPhotos, gps, signature: signature!, signeLe: now, pvVersion: d.inspection?.pvVersion ?? 1 },
    }), { comment: obs || undefined, notify: { text: `PV signé sur ${d.id}`, roles: next === "cpop" ? [procDef(d.type).commission?.role ?? "cpop", "bureau"] : ["bureau"] } })
    toast.success("Procès-verbal signé", { description: next === "cpop" ? `Transmis pour ${procDef(d.type).commission?.label ?? "avis"}.` : "Transmis au bureau pour le projet de décision." })
    router.push(`/dossiers/${d.id}`)
  }

  return (
    <>
      <Link href="/inspections" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Missions
      </Link>

      <div className="relative mb-6 overflow-hidden rounded-3xl bg-brand-deep p-6 text-white">
        <div className="absolute inset-0 bg-grid-light opacity-60" />
        <div className="absolute -right-10 -bottom-20 size-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <DossierId id={d.id} className="text-white/80" /> · {d.mission?.ordre} · {categoryById(d.categorie).bp}
            </div>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">{subjectTitle(d)}</h1>
            <p className="text-sm text-white/60">{d.etablissement.adresse}, {d.etablissement.commune} — visite du {fmtDate(d.mission?.date, "EEEE d MMMM")}</p>
          </div>
          <div className="flex gap-6">
            <div><div className="font-heading text-3xl font-bold">{filled}/{GRILLE.length}</div><div className="text-[11px] text-white/60">points contrôlés</div></div>
            <div><div className="font-heading text-3xl font-bold">{totalPhotos}</div><div className="text-[11px] text-white/60">photos</div></div>
            <div><div className={cn("font-heading text-3xl font-bold", nc && "text-rose-300")}>{nc}</div><div className="text-[11px] text-white/60">non-conformités</div></div>
          </div>
        </div>
      </div>

      {!editable && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm">
          <Lock className="size-4 text-muted-foreground" />
          {signed
            ? `PV v${d.inspection!.pvVersion} signé le ${fmtDate(d.inspection!.signeLe)} — un PV signé n’est jamais écrasé ; toute correction crée une nouvelle version.`
            : `Lecture seule — saisie réservée aux inspecteurs désignés : ${d.mission?.inspecteurs.map(actorName).join(", ") ?? "aucun"}.`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s} className="card-elevated p-5">
              <h2 className="mb-4 font-heading font-semibold">{s}</h2>
              <div className="space-y-4">
                {GRILLE.filter((g) => g.section === s).map((g) => (
                  <div key={g.id} className="rounded-xl border p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm font-medium">{g.label}</div>
                      <div className="flex gap-1.5">
                        {OPTIONS.map((o) => (
                          <button
                            key={o.v}
                            disabled={!editable}
                            onClick={() => setGrille({ ...grille, [g.id]: { ...grille[g.id], v: o.v } })}
                            className={cn(
                              "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed",
                              grille[g.id]?.v === o.v ? o.cls : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <o.icon className="size-3.5" /> {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {grille[g.id]?.v && grille[g.id].v !== "conforme" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                        <Input
                          disabled={!editable}
                          value={grille[g.id].obs}
                          onChange={(e) => setGrille({ ...grille, [g.id]: { ...grille[g.id], obs: e.target.value } })}
                          placeholder="Constat / mesure corrective attendue"
                          className="mt-2 h-9 rounded-lg"
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
          <section className="card-elevated p-5">
            <h2 className="mb-3 font-heading font-semibold">Observations générales</h2>
            <Textarea disabled={!editable} value={obs} onChange={(e) => setObs(e.target.value)} rows={4} placeholder="Synthèse de la visite, réserves, recommandations…" />
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="card-elevated p-5">
            <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold"><Camera className="size-4 text-brand-green" /> Preuves</h3>
            <label className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:border-brand-green/50", !editable && "pointer-events-none opacity-50")}>
              <Camera className="size-4" /> Prendre / joindre des photos
              <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f))])} />
            </label>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {photos.map((p) => <img key={p} src={p} alt="" className="aspect-square rounded-lg object-cover" />)}
              </div>
            )}
            <Button
              variant="outline"
              disabled={!editable}
              className="mt-3 h-10 w-full rounded-xl"
              onClick={() => {
                setGpsBusy(true)
                const fb = () => { setGps({ lat: -4.3317 - Math.random() * 0.05, lng: 15.3139 + Math.random() * 0.05 }); setGpsBusy(false) }
                if (!navigator.geolocation) return fb()
                navigator.geolocation.getCurrentPosition((p) => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsBusy(false) }, fb, { timeout: 5000 })
              }}
            >
              {gpsBusy ? <LoaderCircle className="animate-spin" /> : <Navigation />} {gps ? "Recapturer la position" : "Capturer la position GPS"}
            </Button>
            {gps && (
              <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-brand-green" /> {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
              </div>
            )}
          </div>

          {editable ? (
            <div className="card-elevated p-5">
              <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold"><PenLine className="size-4 text-brand-green" /> Signature du PV</h3>
              <SignaturePad onChange={setSignature} />
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="h-10 w-full rounded-xl" onClick={save}>
                  <Save /> Enregistrer la visite
                </Button>
                <Button className="h-10 w-full rounded-xl bg-brand-green text-white hover:bg-brand-green/90" disabled={filled < GRILLE.length || !signature || !gps} onClick={sign}>
                  Signer et transmettre le PV
                </Button>
                {(filled < GRILLE.length || !signature || !gps) && (
                  <p className="text-[11px] text-muted-foreground">Requis : grille complète, position GPS et signature.</p>
                )}
              </div>
            </div>
          ) : (
            signed && d.inspection?.signature && (
              <div className="card-elevated p-5">
                <h3 className="mb-2 font-heading text-sm font-semibold">Signature apposée</h3>
                <img src={d.inspection.signature} alt="Signature" className="h-20 rounded-lg border bg-white p-1" />
              </div>
            )
          )}
        </aside>
      </div>
    </>
  )
}
