import type { Dossier, ModuleId, ProcedureType, User } from "./types"
import { canSee } from "./workflow"
import { procDef } from "./procedures"

/**
 * Rapports PDF : paramètres communs au générateur (/rapports) et à la page
 * imprimable (/impression/rapport), transmis par l’URL.
 */

export type RapportType = "activite" | "delais" | "decisions" | "procedure"
export type Periode = "30" | "90" | "365" | "tout"

export interface RapportParams {
  type: RapportType
  module: ModuleId | "all"
  procedure: ProcedureType
  province: string // "all" = toutes les provinces visibles
  periode: Periode
}

export const RAPPORTS: Record<RapportType, { titre: string; description: string; contenu: string[] }> = {
  activite: {
    titre: "Rapport d’activité",
    description: "Synthèse de l’instruction : volumes, répartition par procédure et par état, décisions rendues.",
    contenu: ["Indicateurs clés", "Dossiers par procédure et par état", "Répartition par province", "Décisions favorables / défavorables"],
  },
  delais: {
    titre: "Rapport des délais d’instruction",
    description: "Suivi des délais en jours ouvrables : dossiers en cours, consommation, suspensions et retards.",
    contenu: ["Respect des délais par procédure", "Dossiers en délai critique", "Liste des dossiers en cours triée par urgence"],
  },
  decisions: {
    titre: "Rapport des décisions et titres délivrés",
    description: "Décisions signées sur la période et état des titres au registre (en vigueur, à renouveler, expirés, retirés).",
    contenu: ["Décisions signées par issue", "Titres délivrés et validité", "Retraits"],
  },
  procedure: {
    titre: "Rapport par procédure",
    description: "Circuit d’une procédure : nombre de dossiers à chaque état et liste détaillée des dossiers.",
    contenu: ["Dossiers par état du circuit", "Délais de la procédure", "Liste détaillée des dossiers"],
  },
}

export const PERIODES: Record<Periode, string> = {
  "30": "30 derniers jours",
  "90": "90 derniers jours",
  "365": "12 derniers mois",
  tout: "Depuis l’origine",
}

export const DEFAULT_PARAMS: RapportParams = { type: "activite", module: "all", procedure: "avis_implantation", province: "all", periode: "tout" }

export function toQuery(p: RapportParams) {
  return new URLSearchParams({ type: p.type, module: p.module, procedure: p.procedure, province: p.province, periode: p.periode }).toString()
}

export function fromQuery(sp: URLSearchParams): RapportParams {
  const pick = <T extends string>(k: string, allowed: readonly string[], def: T) => ((v) => (v && allowed.includes(v) ? (v as T) : def))(sp.get(k))
  return {
    type: pick("type", Object.keys(RAPPORTS), DEFAULT_PARAMS.type),
    module: (sp.get("module") as RapportParams["module"]) ?? "all",
    procedure: (sp.get("procedure") as ProcedureType) ?? DEFAULT_PARAMS.procedure,
    province: sp.get("province") ?? "all",
    periode: pick("periode", Object.keys(PERIODES), DEFAULT_PARAMS.periode),
  }
}

/** Dossiers couverts par le rapport : visibles par l’utilisateur, puis filtrés. */
export function dossiersFor(user: User, all: Dossier[], p: RapportParams, now: number) {
  const since = p.periode === "tout" ? 0 : now - Number(p.periode) * 86400000
  return all.filter(
    (d) =>
      canSee(user, d) &&
      d.status !== "brouillon" &&
      (p.type === "procedure" ? d.type === p.procedure : p.module === "all" || procDef(d.type).module === p.module) &&
      (p.province === "all" || d.province === p.province) &&
      new Date(d.submittedAt ?? d.createdAt).getTime() >= since
  )
}
