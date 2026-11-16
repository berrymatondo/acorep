import type { Dossier, ModuleId } from "./types"
import { isPositive, procDef, subjectTitle } from "./procedures"

export type RegistryStatus = "valide" | "a_renouveler" | "expiree" | "retiree"

export interface RegistryEntry {
  dossier: Dossier
  module: ModuleId
  numero: string
  titre: string
  titulaire: string
  delivreLe: string
  validiteFin?: string
  statut: RegistryStatus
  historique: { dossier: Dossier; label: string }[]
}

const DAY = 86400000
/** Procédures dont la décision positive produit un titre inscrit au registre. */
const DELIVRABLES = ["avis_implantation", "pv_constat", "licence", "enregistrement_produit", "amm_nouveau", "autorisation_medicale", "import_export"] as const

/**
 * Registres réglementaires (« résultats / délivrables » du RIMS) : établissements
 * autorisés, produits enregistrés, AMM délivrées, autres autorisations. Les
 * renouvellements et variations sont rattachés à l’AMM d’origine.
 */
export function buildRegistry(dossiers: Dossier[], now = Date.now()): RegistryEntry[] {
  const signed = dossiers.filter((d) => d.decision?.signeLe && isPositive(d))
  return signed
    .filter((d) => (DELIVRABLES as readonly string[]).includes(d.type))
    .map((d) => {
      const children = signed.filter((c) => c.parentId === d.id && (c.type === "amm_variation" || c.type === "amm_renouvellement"))
      const fins = [d.decision!.validiteFin, ...children.filter((c) => c.type === "amm_renouvellement").map((c) => c.decision!.validiteFin)].filter(Boolean) as string[]
      const validiteFin = fins.sort().at(-1)
      const mois = procDef(d.type).validiteMois ?? 60
      const seuil = Math.min(180, mois * 30.44 * 0.2) * DAY
      const statut: RegistryStatus = d.decision!.retrait
        ? "retiree"
        : validiteFin && new Date(validiteFin).getTime() < now
          ? "expiree"
          : validiteFin && new Date(validiteFin).getTime() - now < seuil
            ? "a_renouveler"
            : "valide"
      return {
        dossier: d,
        module: procDef(d.type).module,
        numero: d.decision!.numero ?? d.id,
        titre: subjectTitle(d),
        titulaire: d.etablissement.nom,
        delivreLe: d.decision!.signeLe!,
        validiteFin,
        statut,
        historique: children.map((c) => ({ dossier: c, label: c.type === "amm_variation" ? `Modification — ${c.details?.typeVariation ?? "variation"}` : "Renouvellement" })),
      }
    })
    .sort((a, b) => b.delivreLe.localeCompare(a.delivreLe))
}

export const REGISTRY_STATUS: Record<RegistryStatus, { label: string; tone: string }> = {
  valide: { label: "En vigueur", tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  a_renouveler: { label: "À renouveler", tone: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  expiree: { label: "Expirée", tone: "bg-stone-500/15 text-stone-700 dark:text-stone-300" },
  retiree: { label: "Retirée", tone: "bg-rose-500/12 text-rose-700 dark:text-rose-300" },
}
