import type { Dossier, Role, Status, User } from "./types"
import { USERS, provinceCode } from "./referentiels"
import { checklistFor, grilleFor, procDef, stageLabel } from "./procedures"

export interface Stage {
  id: Status
  label: string
  hint: string
}

/** Étapes génériques (libellés par défaut), utilisées pour les vues transverses. */
export const STAGES: Stage[] = (["depose", "recevabilite", "paiement", "evaluation", "inspection", "cpop", "projet", "signature", "notifie", "archive"] as Status[]).map(
  (id) => ({ id, ...stageLabel("avis_implantation", id), ...(id === "evaluation" ? { label: "Évaluation", hint: "Experts / exigences" } : {}), ...(id === "cpop" ? { label: "Avis collégial", hint: "CPOP / commissions" } : {}) })
)

export function stagesFor(d: Pick<Dossier, "type">): Stage[] {
  return procDef(d.type).stages.map((id) => ({ id, ...stageLabel(d.type, id) }))
}

export function progress(d: Dossier) {
  const st = procDef(d.type).stages
  if (d.status === "brouillon") return 0
  const i = st.indexOf(d.status === "complements" ? "recevabilite" : d.status)
  return Math.round(((i + (d.status === "archive" ? 1 : 0.5)) / st.length) * 100)
}

/** Cloisonnement par rôle et province (critère de recette « Sécurité »). */
export function canSee(u: User, d: Dossier) {
  if (u.role === "demandeur") return d.ownerId === u.id
  if (u.role === "dg") return d.status !== "brouillon"
  return d.province === u.province && d.status !== "brouillon"
}

/** Rôle attendu pour faire avancer le dossier, selon l’étape et la procédure. */
export function ownerRole(d: Dossier): Role | null {
  const def = procDef(d.type)
  switch (d.status) {
    case "brouillon":
    case "complements":
      return "demandeur"
    case "depose":
      return "secretariat"
    case "recevabilite":
      return "bureau"
    case "paiement":
      return d.paiement?.inviteLe && !d.paiement.preuve ? "demandeur" : "finance"
    case "evaluation":
      return def.evaluation?.role ?? "expert"
    case "inspection":
      return d.mission ? "inspecteur" : "bureau"
    case "cpop":
      return def.commission?.role ?? "cpop"
    case "projet":
      return "bureau"
    case "signature":
      return def.signataire
    case "notifie":
      return d.notification?.recuLe ? "secretariat" : "demandeur"
    default:
      return null
  }
}

/** L’utilisateur est-il habilité à agir maintenant sur ce dossier ? */
export function canAct(u: User, d: Dossier) {
  const r = ownerRole(d)
  if (!r) return false
  if (r === "demandeur") return u.id === d.ownerId
  if (u.role !== r) return false
  if (r === "inspecteur") return !!d.mission?.inspecteurs.includes(u.id)
  return u.province === null || u.province === d.province
}

export function needsMyAction(u: User, d: Dossier) {
  return canSee(u, d) && canAct(u, d)
}

export function checklistComplete(d: Dossier) {
  return checklistFor(d.type).every((c) => d.checklist[c.id] === "ok" || d.checklist[c.id] === "na")
}

export function grilleComplete(d: Dossier) {
  return grilleFor(d.type).every((g) => !!d.inspection?.grille[g.id]?.v)
}

export function evaluationComplete(d: Dossier) {
  const axes = procDef(d.type).evaluation?.axes ?? []
  return axes.every((a) => !!d.evaluation?.axes[a.id])
}

export function actorName(id: string) {
  const u = USERS.find((x) => x.id === id)
  if (u) return u.nom
  if (id.startsWith("agent-")) return `Agent provincial (${id.slice(6)})`
  if (id.startsWith("dem-")) return "Demandeur"
  if (id === "system") return "Système RIMS"
  return id
}

export function agentFor(province: string) {
  return `agent-${provinceCode(province)}`
}
