"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import confettiBurst from "./burst"
import {
  ArrowRight, Archive, CircleCheck, FileText, FlaskConical, HandCoins, KeyRound, Lock, PenLine, Radar, Send, Stamp, Undo2, UserRound, Users, SkipForward,
} from "lucide-react"
import type { Conclusion, Dossier, Role, Status } from "@/lib/types"
import { useCurrentUser, useRims } from "@/lib/store"
import { ROLES, USERS } from "@/lib/referentiels"
import { canAct, checklistComplete, evaluationComplete, ownerRole } from "@/lib/workflow"
import { checklistFor, nextStatus, outcomeOf, procDef, requiredPieces } from "@/lib/procedures"
import { fmtDate, fmtDateTime } from "@/lib/dates"
import { sha256 } from "@/lib/sha256"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileDrop, type HashedFile } from "@/components/platform/file-drop"
import { cn } from "@/lib/utils"

export function personaFor(d: Dossier, role: Role) {
  if (role === "demandeur") return USERS.find((u) => u.id === d.ownerId)
  if (role === "dg") return USERS.find((u) => u.role === "dg")
  if (role === "inspecteur" && d.mission) return USERS.find((u) => d.mission!.inspecteurs.includes(u.id))
  return USERS.find((u) => u.role === role && u.province === d.province)
}

function Section({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-green/12 text-brand-green">
          <Icon className="size-4" />
        </span>
        <div className="font-heading font-semibold">{title}</div>
      </div>
      {children}
    </div>
  )
}

function CommentDialog({
  trigger, title, description, confirm, onConfirm, destructive,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  confirm: string
  onConfirm: (c: string) => void
  destructive?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [c, setC] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea value={c} onChange={(e) => setC(e.target.value)} placeholder="Motif (obligatoire, visible dans l’historique)" rows={4} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={c.trim().length < 5}
            onClick={() => {
              onConfirm(c.trim())
              setOpen(false)
              setC("")
            }}
          >
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const primary = "h-10 w-full rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-sky-400 dark:text-slate-950"
const green = "h-10 w-full rounded-xl bg-brand-green text-white hover:bg-brand-green/90"

const CONCLUSIONS: { v: Conclusion; label: string; cls: string }[] = [
  { v: "favorable", label: "Favorable", cls: "border-brand-green bg-brand-green text-white" },
  { v: "reserves", label: "Avec réserves", cls: "border-amber-500 bg-amber-500 text-white" },
  { v: "defavorable", label: "Défavorable", cls: "border-rose-500 bg-rose-500 text-white" },
]

export function DossierActions({ d }: { d: Dossier }) {
  const user = useCurrentUser()
  const act = useRims((s) => s.act)
  const setUser = useRims((s) => s.setUser)
  const def = procDef(d.type)
  const role = ownerRole(d)
  const allowed = canAct(user, d)

  /** Fait avancer le dossier et notifie l’acteur suivant. */
  const advance = (action: string, patch: (x: Dossier) => Partial<Dossier>, opts?: { comment?: string; toast?: string; ownerToo?: boolean }) => {
    const changes = patch(d)
    const nextOwner = ownerRole({ ...d, ...changes })
    act(d.id, action, () => changes, {
      comment: opts?.comment,
      notify: { text: `${d.id} — ${action}`, roles: nextOwner && nextOwner !== "demandeur" ? [nextOwner] : [], owner: nextOwner === "demandeur" || opts?.ownerToo },
    })
    if (opts?.toast) toast.success(opts.toast)
  }
  const next = (from: Status) => nextStatus(d, from)

  // états locaux de formulaires
  const [assignee, setAssignee] = useState("u-bur")
  const [checks, setChecks] = useState(d.checklist)
  const [reponse, setReponse] = useState("")
  const [complFile, setComplFile] = useState<HashedFile | null>(null)
  const [preuve, setPreuve] = useState<HashedFile | null>(null)
  const [missionDate, setMissionDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
  const [team, setTeam] = useState<string[]>(["u-ins"])
  const [avis, setAvis] = useState<"favorable" | "defavorable">("favorable")
  const [motif, setMotif] = useState("")
  const [axis, setAxis] = useState(def.evaluation?.axes.find((a) => !d.evaluation?.axes[a.id])?.id ?? def.evaluation?.axes[0]?.id ?? "")
  const [conclusion, setConclusion] = useState<Conclusion>("favorable")
  const [rapport, setRapport] = useState("")
  const evalNegative = Object.values(d.evaluation?.axes ?? {}).some((a) => a.conclusion === "defavorable")
  const defaultIssue = d.cpop?.avis === "defavorable" || evalNegative ? def.outcomes.find((o) => !o.positive)!.id : def.outcomes[0].id
  const [issue, setIssue] = useState<string>(d.decision?.issue ?? defaultIssue)
  const [motivation, setMotivation] = useState(
    d.decision?.motivation ??
      (defaultIssue === def.outcomes[0].id
        ? "Considérant la recevabilité du dossier, les conclusions de l’instruction et les avis recueillis, "
        : "Considérant que les exigences réglementaires ne sont pas satisfaites, notamment ")
  )
  const [otp, setOtp] = useState("")
  const [signOpen, setSignOpen] = useState(false)

  if (d.status === "archive")
    return (
      <Section title="Dossier clôturé" icon={Archive}>
        <p className="text-sm text-muted-foreground">Classé et archivé. L’historique est inviolable et reste consultable.</p>
        <DocLinks d={d} />
      </Section>
    )

  if (!allowed) {
    const p = role ? personaFor(d, role) : undefined
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Lock className="size-4" />
          </span>
          <div>
            <div className="font-heading font-semibold">En attente</div>
            <div className="text-xs text-muted-foreground">Action réservée : {role ? ROLES[role].label : "—"}</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Votre profil ({ROLES[user.role].short}) ne dispose pas de l’habilitation requise pour cette étape. Le contrôle est appliqué par le moteur de workflow.
        </p>
        {p && (
          <Button
            variant="outline"
            className="h-10 w-full justify-between rounded-xl"
            onClick={() => {
              setUser(p.id)
              toast.success(`Profil : ${p.nom}`, { description: ROLES[p.role].label })
            }}
          >
            <span className="flex items-center gap-2">
              <UserRound className="size-4" /> Passer au profil {p.nom.split(" ").slice(-1)}
            </span>
            <ArrowRight className="size-4" />
          </Button>
        )}
        <DocLinks d={d} />
      </div>
    )
  }

  switch (d.status) {
    case "brouillon": {
      const missing = requiredPieces(d.type, d.categorie).filter((r) => !d.pieces.some((p) => p.typeId === r.id))
      return (
        <Section title="Brouillon" icon={FileText}>
          <p className="text-sm text-muted-foreground">
            {missing.length ? `${missing.length} pièce(s) obligatoire(s) manquante(s). La soumission est bloquée tant que le dossier est incomplet.` : "Le dossier est complet et peut être soumis."}
          </p>
          <Button asChild className={green}>
            <Link href={`/nouvelle-demande?brouillon=${d.id}`}>Reprendre le brouillon</Link>
          </Button>
        </Section>
      )
    }
    case "depose":
      return (
        <Section title="Réception & orientation" icon={Send}>
          <p className="text-sm text-muted-foreground">Accusé {d.accuseRef} émis automatiquement au dépôt. Inscrivez le dossier au registre et orientez-le.</p>
          <div className="space-y-2">
            <Label className="text-xs">Agent instructeur</Label>
            <RadioGroup value={assignee} onValueChange={setAssignee}>
              {USERS.filter((u) => u.role === "bureau").map((u) => (
                <label key={u.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                  <RadioGroupItem value={u.id} /> {u.nom} <span className="ml-auto text-xs text-muted-foreground">Bureau</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <Button className={primary} onClick={() => advance("Dossier enregistré au registre et orienté", () => ({ status: next("depose"), assigneeId: assignee }), { toast: "Dossier orienté vers le bureau instructeur" })}>
            Enregistrer et orienter <ArrowRight />
          </Button>
        </Section>
      )
    case "recevabilite": {
      const items = checklistFor(d.type)
      const complete = items.every((c) => checks[c.id] === "ok" || checks[c.id] === "na")
      const kos = items.filter((c) => checks[c.id] === "ko")
      return (
        <Section title="Contrôle de recevabilité" icon={CircleCheck}>
          <div className="space-y-1.5">
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border bg-card p-2 text-[13px]">
                <span className="flex-1 leading-tight">{c.label}</span>
                <div className="flex overflow-hidden rounded-md border">
                  {(["ok", "ko", "na"] as const).map((v) => (
                    <button
                      key={v}
                      aria-label={`${c.label} : ${v}`}
                      onClick={() => setChecks({ ...checks, [c.id]: v })}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold uppercase transition-colors",
                        checks[c.id] === v ? (v === "ok" ? "bg-brand-green text-white" : v === "ko" ? "bg-rose-500 text-white" : "bg-slate-500 text-white") : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {v === "ok" ? "✓" : v === "ko" ? "✕" : "N/A"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button className={green} disabled={!complete} onClick={() => advance("Recevabilité validée", () => ({ status: next("recevabilite"), checklist: checks }), { toast: "Recevabilité validée" })}>
            Valider la recevabilité
          </Button>
          <CommentDialog
            trigger={<Button variant="outline" className="h-10 w-full rounded-xl">Demander des compléments</Button>}
            title="Demande de compléments"
            description="Le délai d’instruction est suspendu jusqu’à réception des compléments. Le demandeur est notifié."
            confirm="Envoyer et suspendre le délai"
            onConfirm={(c) => {
              const now = new Date().toISOString()
              advance("Demande de compléments — délai suspendu", (x) => ({ status: "complements", checklist: checks, complementsDemandes: c, suspensions: [...x.suspensions, { debut: now, motif: "Compléments demandés" }] }), { comment: c })
              toast.warning("Compléments demandés — délai suspendu")
            }}
          />
          {kos.length > 0 && !complete && <p className="text-xs text-rose-600">{kos.length} point(s) non conforme(s) : demandez des compléments.</p>}
        </Section>
      )
    }
    case "complements":
      return (
        <Section title="Compléments demandés" icon={FileText}>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-sm">
            <div className="mb-1 text-[11px] font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-300">Motif de l’instructeur</div>
            {d.complementsDemandes}
          </div>
          <FileDrop label="Pièce complémentaire" value={complFile} onFile={setComplFile} />
          <Textarea value={reponse} onChange={(e) => setReponse(e.target.value)} placeholder="Votre réponse à l’instructeur…" rows={3} />
          <Button
            className={green}
            disabled={!complFile || reponse.trim().length < 3}
            onClick={() => {
              const now = new Date().toISOString()
              advance("Compléments transmis — reprise du délai", (x) => ({
                status: "recevabilite",
                suspensions: x.suspensions.map((s, i) => (i === x.suspensions.length - 1 && !s.fin ? { ...s, fin: now } : s)),
                pieces: [...x.pieces, { id: `${x.id}-c${x.pieces.length}`, typeId: "complement", nom: complFile!.nom, taille: complFile!.taille, hash: complFile!.hash, version: 1, deposePar: user.id, deposeLe: now, visibilite: "demandeur" }],
                checklist: Object.fromEntries(Object.entries(x.checklist).map(([k, v]) => [k, v === "ko" ? null : v])),
              }), { comment: reponse, toast: "Compléments transmis — le délai reprend" })
            }}
          >
            Transmettre les compléments
          </Button>
        </Section>
      )
    case "paiement":
      if (!d.paiement?.inviteLe)
        return (
          <Section title="Invitation à payer" icon={HandCoins}>
            <div className="rounded-xl bg-muted/60 p-4">
              <div className="text-xs text-muted-foreground">Redevance — {d.paiement?.reference}</div>
              <div className="font-heading text-3xl font-bold">{d.paiement?.montant.toLocaleString("fr-FR")} $</div>
              <div className="text-[11px] text-muted-foreground">Montant indicatif, tarification à valider (§14)</div>
            </div>
            <Button className={primary} onClick={() => advance("Invitation à payer émise", (x) => ({ paiement: { ...x.paiement!, inviteLe: new Date().toISOString() } }), { toast: "Invitation à payer émise et notifiée" })}>
              Émettre l’invitation à payer
            </Button>
          </Section>
        )
      if (!d.paiement.preuve)
        return (
          <Section title="Paiement de la redevance" icon={HandCoins}>
            <p className="text-sm text-muted-foreground">
              Réglez <b className="text-foreground">{d.paiement.montant.toLocaleString("fr-FR")} $</b> (réf. {d.paiement.reference}) puis déposez le bordereau.
            </p>
            <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Paiement électronique intégré : prévu en phase 2 (F11).</div>
            <FileDrop label="Justificatif de paiement" hint="Bordereau bancaire, reçu mobile money" value={preuve} onFile={setPreuve} />
            <Button className={green} disabled={!preuve} onClick={() => advance("Justificatif de paiement déposé", (x) => ({ paiement: { ...x.paiement!, preuve: preuve!.nom } }), { toast: "Justificatif transmis à la cellule financière" })}>
              Déposer le justificatif
            </Button>
          </Section>
        )
      return (
        <Section title="Vérification du paiement" icon={HandCoins}>
          <div className="rounded-xl border bg-card p-3 text-sm">
            <div className="text-xs text-muted-foreground">Justificatif reçu</div>
            <div className="font-mono text-xs font-semibold">{d.paiement.preuve}</div>
            <div className="mt-2 text-xs text-muted-foreground">Montant attendu : {d.paiement.montant.toLocaleString("fr-FR")} $</div>
          </div>
          <Button className={green} onClick={() => advance("Paiement vérifié et validé", (x) => ({ status: next("paiement"), paiement: { ...x.paiement!, valideLe: new Date().toISOString() } }), { toast: "Paiement validé" })}>
            Valider le paiement
          </Button>
          <CommentDialog
            trigger={<Button variant="outline" className="h-10 w-full rounded-xl">Rejeter le justificatif</Button>}
            title="Rejeter le justificatif"
            description="Le demandeur devra déposer un nouveau justificatif."
            confirm="Rejeter"
            destructive
            onConfirm={(c) => advance("Justificatif de paiement rejeté", (x) => ({ paiement: { ...x.paiement!, preuve: undefined } }), { comment: c })}
          />
        </Section>
      )
    case "evaluation": {
      const ev = def.evaluation!
      const done = evaluationComplete(d)
      return (
        <Section title={ev.label} icon={FlaskConical}>
          <div className="space-y-1.5">
            {ev.axes.map((a) => {
              const r = d.evaluation?.axes[a.id]
              return (
                <button
                  key={a.id}
                  onClick={() => setAxis(a.id)}
                  className={cn("flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-[13px] transition-colors", axis === a.id && "border-brand-green bg-accent/40")}
                >
                  <CircleCheck className={cn("size-4 shrink-0", r ? (r.conclusion === "defavorable" ? "text-rose-500" : r.conclusion === "reserves" ? "text-amber-500" : "text-brand-green") : "text-muted-foreground/40")} />
                  <span className="flex-1">{a.label}</span>
                  {r && <span className="text-[10px] text-muted-foreground">{CONCLUSIONS.find((c) => c.v === r.conclusion)?.label}</span>}
                </button>
              )
            })}
          </div>
          <div className="space-y-2 rounded-xl bg-muted/50 p-3">
            <div className="text-xs font-semibold">Rapport — {ev.axes.find((a) => a.id === axis)?.label}</div>
            <div className="grid grid-cols-3 gap-1">
              {CONCLUSIONS.map((c) => (
                <button key={c.v} onClick={() => setConclusion(c.v)} className={cn("rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold", conclusion === c.v ? c.cls : "bg-card text-muted-foreground")}>
                  {c.label}
                </button>
              ))}
            </div>
            <Textarea value={rapport} onChange={(e) => setRapport(e.target.value)} placeholder="Conclusions motivées de l’évaluateur…" rows={3} className="bg-card" />
            <Button
              variant="outline"
              className="h-9 w-full rounded-xl"
              disabled={rapport.trim().length < 10}
              onClick={() => {
                const label = ev.axes.find((a) => a.id === axis)!.label
                advance(`Rapport d’évaluation — ${label}`, (x) => ({
                  evaluation: { ...(x.evaluation ?? {}), axes: { ...(x.evaluation?.axes ?? {}), [axis]: { conclusion, rapport, par: user.id, le: new Date().toISOString() } } },
                }), { comment: rapport, toast: `Rapport « ${label} » enregistré` })
                setRapport("")
                const nextAxis = ev.axes.find((a) => a.id !== axis && !d.evaluation?.axes[a.id])
                if (nextAxis) setAxis(nextAxis.id)
              }}
            >
              Enregistrer le rapport
            </Button>
          </div>
          <Button className={green} disabled={!done} onClick={() => advance("Évaluation clôturée", (x) => ({ status: next("evaluation"), evaluation: { ...x.evaluation!, clotureLe: new Date().toISOString() } }), { toast: "Évaluation clôturée et transmise" })}>
            Clôturer l’évaluation
          </Button>
          {!done && <p className="text-[11px] text-muted-foreground">Chaque critère doit faire l’objet d’un rapport avant clôture.</p>}
        </Section>
      )
    }
    case "inspection":
      if (!d.mission)
        return (
          <Section title="Ordre de mission" icon={Users}>
            {def.inspectionOptionnelle && <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">Pour cette procédure, l’inspection n’est requise que si la vérification des exigences le justifie.</p>}
            <div className="space-y-1.5">
              <Label className="text-xs">Date de visite</Label>
              <Input type="date" value={missionDate} onChange={(e) => setMissionDate(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Équipe d’inspection</Label>
              {USERS.filter((u) => u.role === "inspecteur").map((u) => (
                <label key={u.id} className="flex items-center gap-2.5 rounded-lg border p-2.5 text-sm">
                  <Checkbox checked={team.includes(u.id)} onCheckedChange={(v) => setTeam(v ? [...team, u.id] : team.filter((t) => t !== u.id))} />
                  {u.nom}
                  <span className="ml-auto text-xs text-muted-foreground">{u.titre}</span>
                </label>
              ))}
            </div>
            <Button
              className={primary}
              disabled={team.length === 0}
              onClick={() => advance("Ordre de mission émis", () => ({ mission: { ordre: `OM-${d.id.slice(4)}`, date: new Date(missionDate + "T09:00:00").toISOString(), inspecteurs: team } }), { toast: `Ordre de mission émis — visite le ${fmtDate(missionDate)}` })}
            >
              Émettre l’ordre de mission
            </Button>
            {def.inspectionOptionnelle && (
              <CommentDialog
                trigger={<Button variant="outline" className="h-10 w-full rounded-xl"><SkipForward /> Inspection non requise</Button>}
                title="Dispense d’inspection"
                description="Motivez la dispense : elle est enregistrée au journal d’audit et visible dans la décision."
                confirm="Dispenser et poursuivre"
                onConfirm={(c) => advance("Inspection non requise — dispense motivée", () => ({ status: next("inspection"), inspectionDispensee: { motif: c, le: new Date().toISOString(), par: user.id } }), { comment: c, toast: "Inspection dispensée" })}
              />
            )}
          </Section>
        )
      return (
        <Section title="Inspection des lieux" icon={Radar}>
          <div className="rounded-xl bg-muted/60 p-3 text-sm">
            <div className="text-xs text-muted-foreground">{d.mission.ordre}</div>
            <div className="font-semibold">Visite le {fmtDate(d.mission.date, "EEEE d MMMM")}</div>
          </div>
          <Button asChild className={green}>
            <Link href={`/inspections/${d.id}`}>Ouvrir l’interface terrain <ArrowRight /></Link>
          </Button>
        </Section>
      )
    case "cpop":
      return (
        <Section title={def.commission?.label ?? "Avis collégial"} icon={Users}>
          <RadioGroup value={avis} onValueChange={(v) => setAvis(v as typeof avis)} className="grid grid-cols-2 gap-2">
            {(["favorable", "defavorable"] as const).map((v) => (
              <label key={v} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors", avis === v && (v === "favorable" ? "border-brand-green bg-accent" : "border-rose-400 bg-rose-500/8"))}>
                <RadioGroupItem value={v} /> {v === "favorable" ? "Favorable" : "Défavorable"}
              </label>
            ))}
          </RadioGroup>
          <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Avis documenté et motivé…" rows={4} />
          <Button className={primary} disabled={motif.trim().length < 10} onClick={() => advance(`${def.commission?.label ?? "Avis"} : ${avis}`, () => ({ status: next("cpop"), cpop: { avis, motif, le: new Date().toISOString(), par: user.id } }), { comment: motif, toast: "Avis enregistré" })}>
            Enregistrer l’avis
          </Button>
        </Section>
      )
    case "projet":
      return (
        <Section title="Projet de décision motivée" icon={PenLine}>
          {(d.cpop || d.evaluation) && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {d.cpop && <div>{def.commission?.label} : <b className={d.cpop.avis === "favorable" ? "text-brand-green" : "text-rose-600"}>{d.cpop.avis}</b></div>}
              {d.evaluation && <div>Évaluation : {Object.values(d.evaluation.axes).filter((a) => a.conclusion !== "defavorable").length}/{Object.keys(d.evaluation.axes).length} critère(s) sans objection</div>}
            </div>
          )}
          <RadioGroup value={issue} onValueChange={setIssue} className="grid gap-2">
            {def.outcomes.map((o) => (
              <label key={o.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium", issue === o.id && (o.positive ? "border-brand-green bg-accent" : "border-rose-400 bg-rose-500/8"))}>
                <RadioGroupItem value={o.id} /> {o.label}
              </label>
            ))}
          </RadioGroup>
          <Textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={6} />
          <Button
            className={primary}
            disabled={motivation.trim().length < 30}
            onClick={() => {
              const now = new Date().toISOString()
              advance("Projet de décision rédigé et visé", () => ({ status: next("projet"), decision: { issue, motivation, projetLe: now, visas: [{ role: "bureau", par: user.id, le: now }] } }), { toast: "Projet visé et transmis pour signature" })
            }}
          >
            Viser et transmettre pour signature
          </Button>
        </Section>
      )
    case "signature": {
      const checks: [string, boolean][] = [["Recevabilité conforme", checklistComplete(d)]]
      if (def.stages.includes("paiement")) checks.push(["Paiement validé", !!d.paiement?.valideLe])
      if (def.evaluation) checks.push([`${def.evaluation.label} clôturée`, !!d.evaluation?.clotureLe])
      if (def.stages.includes("inspection")) checks.push([d.inspectionDispensee ? "Inspection dispensée (motivée)" : "PV d’inspection signé", !!d.inspection?.signeLe || !!d.inspectionDispensee])
      if (def.commission) checks.push([`${def.commission.label} : ${d.cpop?.avis ?? "—"}`, !!d.cpop])
      checks.push(["Projet visé par le bureau", !!d.decision?.visas.length])
      const ok = checks.every(([, v]) => v)
      const code = sha256(d.id + user.id).replace(/\D/g, "").slice(0, 6).padEnd(6, "4")
      const out = outcomeOf(d)
      return (
        <Section title="Validation et signature" icon={Stamp}>
          <ul className="space-y-1.5 text-sm">
            {checks.map(([l, v]) => (
              <li key={l} className="flex items-center gap-2">
                <CircleCheck className={cn("size-4 shrink-0", v ? "text-brand-green" : "text-muted-foreground/40")} /> {l}
              </li>
            ))}
          </ul>
          <div className={cn("rounded-xl p-3 text-sm", out?.positive ? "bg-accent text-accent-foreground" : "bg-rose-500/10 text-rose-700 dark:text-rose-300")}>
            Décision proposée : <b>{out?.label}</b>
            {def.validiteMois && out?.positive && <div className="text-xs opacity-80">Validité : {def.validiteMois} mois à compter de la signature</div>}
          </div>
          <Dialog open={signOpen} onOpenChange={setSignOpen}>
            <DialogTrigger asChild>
              <Button className={green} disabled={!ok}><Stamp /> Signer et notifier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-brand-green" /> Authentification forte</DialogTitle>
                <DialogDescription>
                  La signature engage l’autorité ({ROLES[def.signataire].label}). Saisissez le code à usage unique (démo : <b className="font-mono">{code}</b>).
                </DialogDescription>
              </DialogHeader>
              <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="h-12 text-center font-mono text-2xl tracking-[0.5em]" />
              <DialogFooter>
                <Button
                  className="bg-brand-green text-white"
                  disabled={otp !== code}
                  onClick={() => {
                    const now = new Date().toISOString()
                    const positive = !!outcomeOf(d)?.positive
                    advance("Décision signée et notifiée", (x) => ({
                      status: next("signature"),
                      decision: {
                        ...x.decision!, signeLe: now, signePar: user.id, codeVerif: sha256(x.id + now).slice(0, 12).toUpperCase(),
                        numero: `${def.numeroPrefix}/${new Date().getFullYear()}/${x.id.slice(9)}`,
                        validiteFin: def.validiteMois && positive ? new Date(Date.now() + def.validiteMois * 30.44 * 86400000).toISOString() : undefined,
                        visas: [...x.decision!.visas, { role: def.signataire, par: user.id, le: now }],
                      },
                      notification: { envoyeLe: now, canal: "Portail + courriel" },
                    }), { ownerToo: true })
                    setSignOpen(false)
                    confettiBurst()
                    toast.success("Décision signée et notifiée", { description: "Document vérifiable généré et inscrit au registre." })
                  }}
                >
                  Signer électroniquement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <CommentDialog
            trigger={<Button variant="outline" className="h-10 w-full rounded-xl"><Undo2 /> Retour pour correction</Button>}
            title="Retour pour correction"
            description="Le projet de décision retourne au bureau instructeur."
            confirm="Retourner"
            onConfirm={(c) => advance("Projet retourné pour correction", () => ({ status: "projet" }), { comment: c })}
          />
        </Section>
      )
    }
    case "notifie": {
      const out = outcomeOf(d)
      if (!d.notification?.recuLe)
        return (
          <Section title="Décision notifiée" icon={Send}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("rounded-2xl p-4 text-center", out?.positive ? "bg-accent" : "bg-rose-500/10")}>
              <Stamp className={cn("mx-auto size-8", out?.positive ? "text-brand-green" : "text-rose-500")} />
              <div className="mt-2 font-heading text-lg font-bold">{out?.label}</div>
              <div className="text-xs text-muted-foreground">Notifié le {fmtDateTime(d.notification?.envoyeLe)}</div>
            </motion.div>
            <Button className={green} onClick={() => advance("Accusé de réception de la notification", (x) => ({ notification: { ...x.notification!, recuLe: new Date().toISOString() } }), { toast: "Réception confirmée" })}>
              Accuser réception
            </Button>
            <DocLinks d={d} />
          </Section>
        )
      return (
        <Section title="Archivage" icon={Archive}>
          <p className="text-sm text-muted-foreground">Réception confirmée le {fmtDateTime(d.notification.recuLe)}. Classez le dossier selon le plan d’archivage.</p>
          <Button className={primary} onClick={() => advance("Dossier classé et archivé", () => ({ status: "archive" }), { toast: "Dossier archivé" })}>
            <Archive /> Archiver le dossier
          </Button>
          <DocLinks d={d} />
        </Section>
      )
    }
    default:
      return null
  }
}

export function DocLinks({ d }: { d: Dossier }) {
  const def = procDef(d.type)
  const docs: { k: string; label: string; show: boolean }[] = [
    { k: "accuse", label: "Accusé de réception", show: !!d.accuseRef },
    { k: "invitation", label: "Invitation à payer", show: !!d.paiement?.inviteLe },
    { k: "evaluation", label: "Rapport d’évaluation", show: !!d.evaluation?.clotureLe },
    { k: "ordre", label: "Ordre de mission", show: !!d.mission },
    { k: "pv", label: "Procès-verbal de visite", show: !!d.inspection?.signeLe },
    { k: "decision", label: def.documentTitle(d.decision?.issue), show: !!d.decision?.signeLe },
  ]
  const list = docs.filter((x) => x.show)
  if (!list.length) return null
  return (
    <div className="space-y-1.5 border-t pt-4">
      <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Documents générés</div>
      {list.map((x) => (
        <Link key={x.k} href={`/documents/${d.id}?doc=${x.k}`} target="_blank" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted">
          <FileText className="size-4 shrink-0 text-brand-green" /> <span className="truncate">{x.label}</span>
          <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  )
}
