"use client"

import Link from "next/link"
import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import {
  ArrowLeft, ArrowRight, Building2, Check, CircleCheck, FileText, LoaderCircle, Navigation, Save, Send, ShieldCheck, TriangleAlert,
} from "lucide-react"
import { useCurrentUser, useNow, useRims } from "@/lib/store"
import { MODULES, PROVINCES, categoryById } from "@/lib/referentiels"
import {
  PROCEDURES, categoriesFor, checklistFor, feeFor, isPositive, procDef, proceduresOf, requiredPieces, subjectTitle, type Field,
} from "@/lib/procedures"
import type { CategoryId, Dossier, ModuleId, Piece, ProcedureType } from "@/lib/types"
import { fmtDate, fmtDateTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDrop, type HashedFile } from "@/components/platform/file-drop"
import { PageHeader } from "@/components/platform/bits"
import { cn } from "@/lib/utils"
import confettiBurst from "@/components/dossier/burst"

const STEPS = ["Procédure", "Informations", "Pièces", "Soumission"]

interface Form {
  type: ProcedureType
  province: string
  categorie: CategoryId
  parentId?: string
  nom: string
  adresse: string
  commune: string
  gps?: { lat: number; lng: number }
  promoteur: string
  telephone: string
  email: string
  pharmacien: string
  numeroOrdre: string
  details: Record<string, string>
  files: Record<string, HashedFile>
  declaration: boolean
}

function TextField({ label, value, onChange, placeholder, error, mono, required = true }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string | false; mono?: boolean; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label} {required && <span className="text-rose-500">*</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} className={cn("h-10 rounded-xl", mono && "font-mono")} />
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  )
}

function DynamicField({ f, value, onChange, error }: { f: Field; value: string; onChange: (v: string) => void; error?: boolean }) {
  const label = <Label className="text-xs">{f.label} {f.required && <span className="text-rose-500">*</span>}</Label>
  if (f.type === "select")
    return (
      <div className="space-y-1.5">
        {label}
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className="h-10 w-full rounded-xl" aria-invalid={error}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
          <SelectContent>{f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        {error && <p className="text-[11px] text-rose-600">Champ requis</p>}
      </div>
    )
  if (f.type === "textarea")
    return (
      <div className="space-y-1.5 md:col-span-2">
        {label}
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} rows={3} aria-invalid={error} className="rounded-xl" />
        {error && <p className="text-[11px] text-rose-600">Champ requis</p>}
      </div>
    )
  return (
    <div className="space-y-1.5">
      {label}
      <Input type={f.type === "date" ? "date" : "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} aria-invalid={error} className="h-10 rounded-xl" />
      {error && <p className="text-[11px] text-rose-600">Champ requis</p>}
    </div>
  )
}

function Wizard() {
  const user = useCurrentUser()
  const sp = useSearchParams()
  const router = useRouter()
  const dossiers = useRims((s) => s.dossiers)
  const createDossier = useRims((s) => s.createDossier)
  const act = useRims((s) => s.act)
  const now = useNow()
  const draft = dossiers.find((d) => d.id === sp.get("brouillon") && d.status === "brouillon" && d.ownerId === user.id)

  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState(false)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [done, setDone] = useState<Dossier | null>(null)
  const [f, setF] = useState<Form>(() => {
    if (draft)
      return {
        type: draft.type, province: draft.province, categorie: draft.categorie, parentId: draft.parentId,
        nom: draft.etablissement.nom, adresse: draft.etablissement.adresse, commune: draft.etablissement.commune, gps: draft.etablissement.gps,
        promoteur: draft.promoteur.nom, telephone: draft.promoteur.telephone, email: draft.promoteur.email,
        pharmacien: draft.pharmacien.nom, numeroOrdre: draft.pharmacien.numeroOrdre, details: draft.details ?? {},
        files: Object.fromEntries(draft.pieces.map((p) => [p.typeId, { nom: p.nom, taille: p.taille, hash: p.hash }])),
        declaration: false,
      }
    const type = (sp.get("type") as ProcedureType) ?? "avis_implantation"
    const parent = dossiers.find((d) => d.id === sp.get("parent"))
    return {
      type, province: user.province ?? "Kinshasa", categorie: parent?.categorie ?? categoriesFor(type)[0].id, parentId: parent?.id,
      nom: parent?.etablissement.nom ?? "", adresse: parent?.etablissement.adresse ?? "", commune: parent?.etablissement.commune ?? "",
      promoteur: parent?.promoteur.nom ?? "", telephone: parent?.promoteur.telephone ?? "", email: parent?.promoteur.email ?? "",
      pharmacien: user.nom, numeroOrdre: parent?.pharmacien.numeroOrdre ?? "", details: parent?.details ? { ...parent.details } : {},
      files: {}, declaration: false,
    }
  })
  const [mod, setMod] = useState<ModuleId>(procDef(f.type).module)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const def = procDef(f.type)
  const eligibleParents = def.parent
    ? dossiers.filter(
        (d) =>
          d.ownerId === user.id && def.parent!.types.includes(d.type) && d.decision?.signeLe && isPositive(d) && !d.decision.retrait &&
          (!def.parent!.delaiJours || now - new Date(d.notification!.envoyeLe).getTime() < def.parent!.delaiJours * 86400000)
      )
    : []

  const chooseType = (t: ProcedureType) => {
    setF((x) => ({ ...x, type: t, parentId: undefined, categorie: categoriesFor(t).some((c) => c.id === x.categorie) ? x.categorie : categoriesFor(t)[0].id, files: {}, province: procDef(t).niveau === "central" ? "Kinshasa" : x.province }))
  }

  const req = requiredPieces(f.type, f.categorie)
  const filesOk = req.filter((r) => f.files[r.id]).length
  const fieldErrors = Object.fromEntries((def.fields ?? []).map((fd) => [fd.id, !!fd.required && !(f.details[fd.id] ?? "").trim()]))
  const errors = {
    nom: f.nom.trim().length < 3 && "Champ requis",
    adresse: f.adresse.trim().length < 5 && "Adresse requise",
    commune: f.commune.trim().length < 2 && "Champ requis",
    promoteur: f.promoteur.trim().length < 3 && "Nom requis",
    telephone: !/^\+?[\d\s]{9,}$/.test(f.telephone) && "Numéro invalide",
    email: !/^\S+@\S+\.\S+$/.test(f.email) && "Courriel invalide",
    pharmacien: f.pharmacien.trim().length < 3 && "Champ requis",
    numeroOrdre: f.numeroOrdre.trim().length < 4 && "N° requis",
  }
  const stepValid = [
    !def.parent || !!f.parentId,
    Object.values(errors).every((e) => !e) && Object.values(fieldErrors).every((e) => !e),
    filesOk === req.length,
    f.declaration,
  ]
  const completeness = Math.round((stepValid.filter(Boolean).length / 4) * 100)

  const duplicate = useMemo(() => {
    const key = (f.details.nomCommercial ?? "") + (f.details.dosage ?? "")
    return dossiers.find((d) => {
      if (d.id === draft?.id || d.type !== f.type || d.status === "archive" || d.status === "brouillon") return false
      if (key) return (d.details?.nomCommercial ?? "") + (d.details?.dosage ?? "") === key && d.etablissement.nom.toLowerCase() === f.nom.trim().toLowerCase()
      return f.nom.length > 4 && d.etablissement.nom.toLowerCase() === f.nom.trim().toLowerCase() && d.etablissement.commune.toLowerCase() === f.commune.trim().toLowerCase()
    })
  }, [dossiers, f.nom, f.commune, f.type, f.details.nomCommercial, f.details.dosage, draft?.id])

  const build = (): Omit<Dossier, "id"> => {
    const now = new Date().toISOString()
    return {
      type: f.type, parentId: f.parentId, status: "brouillon", province: f.province, categorie: f.categorie,
      etablissement: { nom: f.nom.trim(), adresse: f.adresse.trim(), commune: f.commune.trim(), gps: f.gps },
      promoteur: { nom: f.promoteur.trim(), telephone: f.telephone.trim(), email: f.email.trim() },
      pharmacien: { nom: f.pharmacien.trim(), numeroOrdre: f.numeroOrdre.trim() },
      details: def.fields || Object.keys(f.details).length ? Object.fromEntries(Object.entries(f.details).map(([k, v]) => [k, v.trim()])) : undefined,
      ownerId: user.id, createdAt: draft?.createdAt ?? now,
      pieces: Object.entries(f.files)
        .filter(([typeId]) => req.some((r) => r.id === typeId))
        .map(([typeId, file], i): Piece => ({ id: `p-${Date.now()}-${i}`, typeId, nom: file.nom, taille: file.taille, hash: file.hash, version: 1, deposePar: user.id, deposeLe: now, visibilite: "demandeur" })),
      checklist: Object.fromEntries(checklistFor(f.type).map((c) => [c.id, null])),
      paiement: def.stages.includes("paiement") ? { montant: feeFor(f.type, f.categorie), reference: "" } : undefined,
      evaluation: undefined, suspensions: [],
    }
  }

  const saveDraft = () => {
    const data = build()
    if (draft) act(draft.id, "Brouillon mis à jour", () => ({ ...data, status: "brouillon" }))
    else {
      const id = createDossier(data, false)
      router.replace(`/nouvelle-demande?brouillon=${id}`)
    }
    toast.success("Brouillon enregistré", { description: "Vous pouvez le reprendre à tout moment." })
  }

  const submit = () => {
    const data = build()
    let id: string
    const withRef = (x: Dossier) => (x.paiement ? { paiement: { ...x.paiement, reference: `IP-${x.id.slice(4)}` } } : {})
    if (draft) {
      id = draft.id
      const now = new Date().toISOString()
      act(id, "Dépôt en ligne — accusé de réception généré", (x) => ({ ...data, status: "depose", submittedAt: now, receivedAt: now, accuseRef: `AR-${id.slice(4)}`, ...withRef({ ...x, ...data }) }), {
        notify: { text: `Nouveau dépôt ${id} à réceptionner`, roles: ["secretariat"] },
      })
    } else {
      id = createDossier(data, true)
      if (data.paiement) act(id, "Référence de redevance attribuée", (x) => withRef(x))
    }
    setDone(useRims.getState().dossiers.find((d) => d.id === id)!)
    confettiBurst()
  }

  if (user.role !== "demandeur")
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-sm text-muted-foreground">Le dépôt de demande est réservé aux profils « Demandeur ». Changez de profil depuis le menu en haut à droite.</p>
      </div>
    )

  if (done)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-2xl">
        <div className="card-elevated relative overflow-hidden p-8 text-center md:p-12">
          <div className="absolute inset-0 bg-guilloche opacity-70" />
          <div className="relative">
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }} className="mx-auto grid size-20 place-items-center rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/30">
              <Check className="size-10" strokeWidth={3} />
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold md:text-3xl">Demande déposée</h2>
            <p className="mt-2 text-sm text-muted-foreground">{PROCEDURES[done.type].label} — {subjectTitle(done)}</p>
            <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-2xl border-2 border-dashed border-brand-navy/30 bg-card px-8 py-4">
              <span className="text-[11px] tracking-widest text-muted-foreground uppercase">Numéro de dossier</span>
              <span className="font-mono text-3xl font-bold tracking-tight text-brand-navy dark:text-sky-300">{done.id}</span>
              <span className="mt-1 font-mono text-xs text-muted-foreground">{done.accuseRef} · {fmtDateTime(done.receivedAt)}</span>
            </div>
            <p className="mx-auto mt-6 max-w-md text-xs text-muted-foreground">Le délai d’instruction court à compter de cette réception. Vous serez notifié à chaque étape.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline" className="h-10 rounded-xl">
                <Link href={`/documents/${done.id}?doc=accuse`} target="_blank"><FileText /> Accusé de réception</Link>
              </Button>
              <Button asChild className="h-10 rounded-xl bg-brand-navy text-white">
                <Link href={`/dossiers/${done.id}`}>Suivre le dossier <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )

  const cats = categoriesFor(f.type)

  return (
    <>
      <PageHeader eyebrow={draft ? `Brouillon ${draft.id}` : "Dépôt en ligne"} title="Nouvelle demande" description="Choisissez le module et la procédure : le formulaire, les pièces exigibles et le circuit d’instruction s’adaptent automatiquement." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-6 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i <= step && setStep(i)} className={cn("group text-left", i > step && "cursor-not-allowed")}>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full bg-brand-green" initial={false} animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} />
                </div>
                <div className={cn("mt-2 text-xs font-semibold", i === step ? "text-foreground" : "text-muted-foreground")}>
                  <span className="font-mono">0{i + 1}</span> {s}
                </div>
              </button>
            ))}
          </div>

          <div className="card-elevated p-5 md:p-7">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block text-xs">Module</Label>
                      <div className="flex flex-wrap gap-2">
                        {MODULES.map((m) => (
                          <button
                            key={m.id}
                            disabled={!!draft}
                            onClick={() => { setMod(m.id); chooseType(proceduresOf(m.id)[0].id) }}
                            className={cn("flex shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50", mod === m.id ? "border-brand-green bg-accent/50" : "hover:border-foreground/20")}
                          >
                            <span className="size-2 rounded-full" style={{ background: m.color }} /> {m.short}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block text-xs">Procédure</Label>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {proceduresOf(mod).map((p) => (
                          <button
                            key={p.id}
                            disabled={!!draft}
                            onClick={() => chooseType(p.id)}
                            className={cn("relative rounded-2xl border-2 p-4 text-left transition-all disabled:opacity-60", f.type === p.id ? "border-brand-green bg-accent/50" : "hover:border-foreground/20")}
                          >
                            {f.type === p.id && <CircleCheck className="absolute top-3 right-3 size-5 text-brand-green" />}
                            <div className="pr-6 font-heading font-semibold">{p.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{p.description}</div>
                            <div className="mt-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                              {p.niveau === "central" ? "Niveau central" : "Direction provinciale"} · {p.stages.length} étapes
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {def.parent && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">{def.parent.label} <span className="text-rose-500">*</span></Label>
                        {eligibleParents.length ? (
                          <Select
                            value={f.parentId}
                            onValueChange={(v) => {
                              const p = dossiers.find((d) => d.id === v)!
                              setF((x) => ({ ...x, parentId: v, categorie: p.categorie, nom: p.etablissement.nom, adresse: p.etablissement.adresse, commune: p.etablissement.commune, promoteur: p.promoteur.nom, telephone: p.promoteur.telephone, email: p.promoteur.email, numeroOrdre: p.pharmacien.numeroOrdre, details: { ...(p.details ?? {}), ...x.details } }))
                            }}
                          >
                            <SelectTrigger className="h-10 w-full rounded-xl"><SelectValue placeholder="Sélectionner le dossier de référence" /></SelectTrigger>
                            <SelectContent>
                              {eligibleParents.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.id} — {subjectTitle(p)}{p.decision?.validiteFin ? ` (valide jusqu’au ${fmtDate(p.decision.validiteFin)})` : ""}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                            Aucun dossier de référence éligible dans votre portefeuille ({def.parent.types.map((t) => PROCEDURES[t].label).join(", ")} favorable{def.parent.delaiJours ? `, notifié depuis moins de ${def.parent.delaiJours} jours` : ""}).
                          </p>
                        )}
                      </div>
                    )}
                    {def.niveau === "provincial" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Province compétente</Label>
                        <Select value={f.province} onValueChange={(v) => set("province", v)}>
                          <SelectTrigger className="h-10 w-full rounded-xl md:w-72"><SelectValue /></SelectTrigger>
                          <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label className="mb-2 block text-xs">Catégorie</Label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {cats.map((c) => (
                          <button
                            key={c.id}
                            disabled={!!f.parentId}
                            onClick={() => setF((x) => ({ ...x, categorie: c.id, files: {} }))}
                            className={cn("rounded-xl border-2 p-3 text-left transition-all disabled:opacity-50", f.categorie === c.id ? "border-brand-green bg-accent/50" : "hover:border-foreground/20")}
                          >
                            <div className="text-sm font-semibold">{c.label}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">{c.bp}{def.stages.includes("paiement") ? ` · redevance ${feeFor(f.type, c.id)} $` : " · sans redevance"}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    {def.fields && (
                      <div>
                        <div className="mb-3 font-heading font-semibold">{def.categoryGroup === "produit" ? "Produit et objet de la demande" : "Informations spécifiques"}</div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {def.fields.map((fd) => (
                            <DynamicField key={fd.id} f={fd} value={f.details[fd.id] ?? ""} onChange={(v) => set("details", { ...f.details, [fd.id]: v })} error={touched && fieldErrors[fd.id]} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="mb-3 flex items-center gap-2 font-heading font-semibold"><Building2 className="size-4 text-brand-green" /> {def.subject.bloc}</div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2"><TextField label={def.subject.nom} value={f.nom} onChange={(v) => set("nom", v)} error={touched && errors.nom} /></div>
                        <TextField label={def.subject.adresse} value={f.adresse} onChange={(v) => set("adresse", v)} placeholder="N°, avenue, quartier" error={touched && errors.adresse} />
                        <TextField label={def.subject.commune} value={f.commune} onChange={(v) => set("commune", v)} error={touched && errors.commune} />
                        {def.subject.bloc.startsWith("Établissement") && (
                          <div className="md:col-span-2">
                            <Button
                              type="button" variant="outline" className="h-10 rounded-xl"
                              onClick={() => {
                                setGpsBusy(true)
                                const fallback = () => { set("gps", { lat: -4.3317 - Math.random() * 0.05, lng: 15.3139 + Math.random() * 0.05 }); setGpsBusy(false) }
                                if (!navigator.geolocation) return fallback()
                                navigator.geolocation.getCurrentPosition((p) => { set("gps", { lat: p.coords.latitude, lng: p.coords.longitude }); setGpsBusy(false) }, fallback, { timeout: 5000 })
                              }}
                            >
                              {gpsBusy ? <LoaderCircle className="animate-spin" /> : <Navigation />}
                              {f.gps ? `Géolocalisé : ${f.gps.lat.toFixed(5)}, ${f.gps.lng.toFixed(5)}` : "Capturer la géolocalisation du site"}
                            </Button>
                          </div>
                        )}
                      </div>
                      {duplicate && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Doublon potentiel : le dossier {duplicate.id} porte sur le même objet. Il sera signalé à l’instructeur.
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="mb-3 font-heading font-semibold">Demandeur</div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <TextField label="Nom complet" value={f.promoteur} onChange={(v) => set("promoteur", v)} error={touched && errors.promoteur} />
                        <TextField label="Téléphone" value={f.telephone} onChange={(v) => set("telephone", v)} placeholder="+243 …" error={touched && errors.telephone} mono />
                        <TextField label="Courriel" value={f.email} onChange={(v) => set("email", v)} error={touched && errors.email} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 font-heading font-semibold">{def.subject.responsable}</div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField label="Nom" value={f.pharmacien} onChange={(v) => set("pharmacien", v)} error={touched && errors.pharmacien} />
                        <TextField label={def.subject.numero} value={f.numeroOrdre} onChange={(v) => set("numeroOrdre", v)} placeholder="CNOP/…" error={touched && errors.numeroOrdre} mono />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-heading font-semibold">Pièces exigibles</div>
                        <div className="text-xs text-muted-foreground">{PROCEDURES[f.type].label} · {categoryById(f.categorie).label}</div>
                      </div>
                      <span className="font-mono text-sm font-bold">{filesOk}/{req.length}</span>
                    </div>
                    <div className="grid gap-2">
                      {req.map((r) => (
                        <FileDrop key={r.id} label={r.label} hint={r.hint} value={f.files[r.id]} onFile={(file) => set("files", { ...f.files, [r.id]: file })} />
                      ))}
                    </div>
                    <Button
                      variant="ghost" size="sm" className="text-xs text-muted-foreground"
                      onClick={() =>
                        set("files", Object.fromEntries(req.map((r) => [r.id, f.files[r.id] ?? { nom: `${r.id}.pdf`, taille: 240_000 + Math.floor(Math.random() * 900_000), hash: Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") }])))
                      }
                    >
                      Démo : joindre des pièces fictives
                    </Button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 rounded-2xl bg-muted/50 p-5 text-sm md:grid-cols-2">
                      <div><div className="text-[11px] text-muted-foreground uppercase">Procédure</div><div className="font-semibold">{PROCEDURES[f.type].label}{f.parentId && ` (réf. ${f.parentId})`}</div></div>
                      <div><div className="text-[11px] text-muted-foreground uppercase">Traitement</div><div className="font-semibold">{def.niveau === "central" ? "Niveau central" : `Province de ${f.province}`}</div></div>
                      <div><div className="text-[11px] text-muted-foreground uppercase">Objet</div><div className="font-semibold">{f.details.nomCommercial ? `${f.details.nomCommercial} ${f.details.dosage ?? ""}` : f.details.produitSuspect ?? f.nom}</div><div className="text-xs text-muted-foreground">{f.nom} — {f.commune}</div></div>
                      <div><div className="text-[11px] text-muted-foreground uppercase">Catégorie</div><div className="font-semibold">{categoryById(f.categorie).label}</div></div>
                      <div><div className="text-[11px] text-muted-foreground uppercase">Redevance</div><div className="font-semibold">{def.stages.includes("paiement") ? `${feeFor(f.type, f.categorie)} $ (indicatif)` : "Aucune"}</div></div>
                      <div><div className="text-[11px] text-muted-foreground uppercase">Pièces</div><div className="font-semibold">{filesOk} pièce(s) scellée(s) SHA-256</div></div>
                    </div>
                    <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors", f.declaration ? "border-brand-green bg-accent/40" : "border-dashed")}>
                      <Checkbox checked={f.declaration} onCheckedChange={(v) => set("declaration", !!v)} className="mt-0.5" />
                      <span className="text-sm">Je certifie sur l’honneur l’exactitude des informations fournies et l’authenticité des pièces jointes. Toute fausse déclaration expose à un rejet de la demande.</span>
                    </label>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t pt-5">
              {step > 0 && (
                <Button variant="ghost" className="h-10 rounded-xl" onClick={() => setStep(step - 1)}>
                  <ArrowLeft /> Retour
                </Button>
              )}
              <Button variant="outline" className="ml-auto h-10 rounded-xl" onClick={saveDraft}>
                <Save /> Enregistrer le brouillon
              </Button>
              {step < 3 ? (
                <Button
                  className="h-10 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-sky-400 dark:text-slate-950"
                  onClick={() => {
                    if (!stepValid[step]) {
                      setTouched(true)
                      toast.error("Étape incomplète", { description: step === 0 ? "Sélectionnez le dossier de référence." : step === 2 ? "Toutes les pièces exigibles doivent être jointes." : "Corrigez les champs signalés." })
                      return
                    }
                    setStep(step + 1)
                  }}
                >
                  Continuer <ArrowRight />
                </Button>
              ) : (
                <Button className="h-10 rounded-xl bg-brand-green text-white hover:bg-brand-green/90" disabled={!stepValid.every(Boolean)} onClick={submit}>
                  <Send /> Soumettre le dossier
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="card-elevated p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Complétude</div>
            <div className="mt-1 font-heading text-4xl font-bold">{completeness} %</div>
            <Progress value={completeness} className="mt-3 h-2" />
            <ul className="mt-4 space-y-2 text-sm">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <CircleCheck className={cn("size-4", stepValid[i] ? "text-brand-green" : "text-muted-foreground/40")} /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-elevated p-5">
            <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase">Circuit d’instruction</div>
            <ol className="space-y-1.5">
              {def.stages.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-xs">
                  <span className="grid size-5 place-items-center rounded-full bg-muted font-mono text-[10px]">{i + 1}</span>
                  {s === "evaluation" ? def.evaluation?.label : s === "cpop" ? def.commission?.label : { depose: "Réception", recevabilite: "Recevabilité", paiement: "Paiement", inspection: def.inspectionOptionnelle ? "Inspection (si nécessaire)" : "Inspection", projet: "Projet de décision", signature: def.signataire === "dg" ? "Signature DG" : "Signature directeur", notifie: "Notification", archive: "Archivage" }[s as string]}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mb-2 size-5 text-brand-green" />
            La soumission est bloquée tant que les champs obligatoires et pièces exigibles ne sont pas fournis. Les empreintes sont calculées localement.
          </div>
        </aside>
      </div>
    </>
  )
}

export default function NewRequestPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  )
}
