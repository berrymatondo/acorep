import type { CategoryId, Dossier, ModuleId, ProcedureType, Role, Status } from "./types"
import { CATEGORIES, CHECKLISTS, GRILLES, PIECE_TYPES, categoryById, type CategoryGroup, type CheckItem, type GrilleItem } from "./referentiels"

/**
 * Moteur de workflow configurable : chaque procédure assemble les mêmes étapes
 * génériques (dépôt, recevabilité, paiement, évaluation, inspection, avis collégial,
 * projet, signature, notification, archivage) avec ses propres pièces, contrôles,
 * critères d’évaluation, acteurs et issues de décision.
 */

export interface Field {
  id: string
  label: string
  placeholder?: string
  type?: "text" | "textarea" | "select" | "date"
  options?: string[]
  required?: boolean
}

export interface Outcome {
  id: string
  label: string
  positive: boolean
}

export interface ProcedureDef {
  id: ProcedureType
  module: ModuleId
  label: string
  short: string
  description: string
  niveau: "provincial" | "central"
  stages: Status[]
  categoryGroup: CategoryGroup
  pieces: string[]
  checklist: string
  grille?: string
  evaluation?: { label: string; hint: string; role: Role; axes: { id: string; label: string }[] }
  commission?: { label: string; role: Role }
  inspectionOptionnelle?: boolean
  signataire: Role
  outcomes: Outcome[]
  parent?: { types: ProcedureType[]; label: string; delaiJours?: number }
  subject: { bloc: string; nom: string; adresse: string; commune: string; responsable: string; numero: string }
  fields?: Field[]
  fee?: { factor?: number; fixed?: number }
  validiteMois?: number
  documentTitle: (issue?: string) => string
  numeroPrefix?: string
}

const ETAB_SUBJECT = { bloc: "Établissement", nom: "Dénomination", adresse: "Adresse", commune: "Commune / ville", responsable: "Pharmacien responsable", numero: "N° d’inscription à l’Ordre" }
const TITULAIRE_SUBJECT = { bloc: "Titulaire / laboratoire", nom: "Raison sociale du titulaire", adresse: "Adresse du siège", commune: "Ville / pays", responsable: "Pharmacien responsable du titulaire", numero: "N° d’inscription à l’Ordre" }
const FAV = (label: string, defLabel: string): Outcome[] => [
  { id: "favorable", label, positive: true },
  { id: "defavorable", label: defLabel, positive: false },
]
const FORMES = ["Comprimé", "Gélule", "Sirop", "Suspension buvable", "Solution injectable", "Poudre pour injection", "Pommade / crème", "Collyre", "Suppositoire"]
const PRODUIT_FIELDS: Field[] = [
  { id: "nomCommercial", label: "Nom commercial", placeholder: "Ex. Febrinol", required: true },
  { id: "dci", label: "DCI (substance active)", placeholder: "Ex. paracétamol", required: true },
  { id: "forme", label: "Forme pharmaceutique", type: "select", options: FORMES, required: true },
  { id: "dosage", label: "Dosage", placeholder: "Ex. 500 mg", required: true },
  { id: "fabricant", label: "Fabricant (site de production)", placeholder: "Nom et ville", required: true },
  { id: "pays", label: "Pays de fabrication", placeholder: "Ex. RD Congo", required: true },
  { id: "classe", label: "Classe thérapeutique", placeholder: "Ex. antalgique", required: false },
]
const PRODUIT_AXES = [
  { id: "qualite", label: "Qualité (module 3)" },
  { id: "securite", label: "Sécurité (module 4)" },
  { id: "efficacite", label: "Efficacité (module 5)" },
]
const CENTRAL_STAGES: Status[] = ["depose", "recevabilite", "paiement", "evaluation", "projet", "signature", "notifie", "archive"]

export const PROCEDURE_DEFS: ProcedureDef[] = [
  {
    id: "avis_implantation", module: "etablissements", label: "Avis d’implantation", short: "Avis", niveau: "provincial",
    description: "Avis préalable sur l’implantation d’un établissement pharmaceutique (POS AQ-POS-ENR-001-26).",
    stages: ["depose", "recevabilite", "paiement", "inspection", "cpop", "projet", "signature", "notifie", "archive"],
    categoryGroup: "pharma", pieces: ["demande", "identite", "ordre", "site", "plan", "statuts", "personnel"],
    checklist: "pharma", grille: "pharma", commission: { label: "Avis du CPOP", role: "cpop" }, signataire: "directeur",
    outcomes: FAV("Avis favorable", "Avis défavorable"), subject: ETAB_SUBJECT,
    documentTitle: (i) => `Avis d’implantation ${i === "defavorable" ? "défavorable" : "favorable"}`, numeroPrefix: "AI",
  },
  {
    id: "pv_constat", module: "etablissements", label: "PV de constat des lieux", short: "PV", niveau: "provincial",
    description: "Procès-verbal de constat des lieux, après avis d’implantation favorable notifié (≤ 90 jours).",
    stages: ["depose", "recevabilite", "paiement", "inspection", "projet", "signature", "notifie", "archive"],
    categoryGroup: "pharma", pieces: ["demande", "identite", "site", "plan", "statuts", "personnel", "avis_ref", "equipements"],
    checklist: "pharma", grille: "pharma", signataire: "directeur",
    outcomes: FAV("Constat conforme", "Constat non conforme"), parent: { types: ["avis_implantation"], label: "Avis d’implantation favorable de référence", delaiJours: 90 },
    subject: ETAB_SUBJECT, documentTitle: () => "Procès-verbal de constat des lieux", numeroPrefix: "PVC",
  },
  {
    id: "licence", module: "etablissements", label: "Licence d’exploitation", short: "Licence", niveau: "provincial",
    description: "Délivrance ou renouvellement de la licence d’exploitation d’un établissement pharmaceutique.",
    stages: ["depose", "recevabilite", "paiement", "inspection", "projet", "signature", "notifie", "archive"],
    categoryGroup: "pharma", pieces: ["demande", "identite", "autorisation_ref", "ordre"], checklist: "licence", grille: "pharma",
    signataire: "directeur", outcomes: FAV("Licence délivrée", "Licence refusée"), subject: ETAB_SUBJECT,
    fields: [
      { id: "typeLicence", label: "Type de licence", type: "select", options: ["Licence d’exploitation d’officine", "Licence de grossiste répartiteur", "Licence d’importateur", "Licence de fabricant"], required: true },
      { id: "licencePrecedente", label: "N° de licence précédente (renouvellement)", placeholder: "Facultatif" },
    ],
    fee: { factor: 0.5 }, validiteMois: 36, documentTitle: () => "Licence d’exploitation", numeroPrefix: "LIC",
  },
  {
    id: "enregistrement_produit", module: "produits", label: "Enregistrement d’un produit pharmaceutique", short: "Enreg.", niveau: "central",
    description: "Dépôt du dossier qualité, sécurité, efficacité ; évaluation par les experts ; décision d’enregistrement.",
    stages: ["depose", "recevabilite", "paiement", "evaluation", "cpop", "projet", "signature", "notifie", "archive"],
    categoryGroup: "produit", pieces: ["demande", "ctd1", "ctd2", "ctd3", "ctd4", "ctd5", "rcp", "bpf", "echantillons"], checklist: "produit",
    evaluation: { label: "Évaluation par les experts", hint: "Qualité, sécurité, efficacité", role: "expert", axes: PRODUIT_AXES },
    commission: { label: "Commission d’enregistrement", role: "commission" }, signataire: "dg",
    outcomes: FAV("Enregistrement accordé", "Enregistrement refusé"), subject: TITULAIRE_SUBJECT, fields: PRODUIT_FIELDS,
    validiteMois: 60, documentTitle: (i) => (i === "defavorable" ? "Décision de refus d’enregistrement" : "Certificat d’enregistrement"), numeroPrefix: "ENR",
  },
  {
    id: "amm_nouveau", module: "amm", label: "AMM — nouveau produit", short: "AMM", niveau: "central",
    description: "Demande d’autorisation de mise sur le marché d’un nouveau produit : évaluation scientifique et réglementaire.",
    stages: ["depose", "recevabilite", "paiement", "evaluation", "cpop", "projet", "signature", "notifie", "archive"],
    categoryGroup: "produit", pieces: ["demande", "ctd1", "ctd2", "ctd3", "ctd4", "ctd5", "rcp", "bpf", "cpp", "echantillons"], checklist: "produit",
    evaluation: { label: "Évaluation scientifique et réglementaire", hint: "Qualité, sécurité, efficacité, bénéfice/risque", role: "expert", axes: [...PRODUIT_AXES, { id: "reglementaire", label: "Conformité réglementaire et étiquetage" }] },
    commission: { label: "Commission AMM", role: "commission" }, signataire: "dg",
    outcomes: FAV("Octroi de l’AMM", "Refus d’AMM"), subject: TITULAIRE_SUBJECT, fields: PRODUIT_FIELDS,
    validiteMois: 60, documentTitle: (i) => (i === "defavorable" ? "Décision de refus d’AMM" : "Décision d’autorisation de mise sur le marché"), numeroPrefix: "AMM",
  },
  {
    id: "amm_variation", module: "amm", label: "AMM — variation", short: "Variation", niveau: "central",
    description: "Modification d’une AMM en vigueur (type IA, IB ou II).",
    stages: CENTRAL_STAGES, categoryGroup: "produit", pieces: ["demande", "amm_ref", "variation_doc"], checklist: "variation",
    evaluation: { label: "Évaluation de la variation", hint: "Impact et conformité", role: "expert", axes: [{ id: "impact", label: "Impact sur qualité, sécurité, efficacité" }, { id: "reglementaire", label: "Conformité réglementaire" }] },
    signataire: "dg", outcomes: FAV("Modification approuvée", "Modification refusée"),
    parent: { types: ["amm_nouveau"], label: "AMM concernée" }, subject: TITULAIRE_SUBJECT,
    fields: [
      { id: "typeVariation", label: "Type de variation", type: "select", options: ["Mineure — type IA", "Mineure — type IB", "Majeure — type II"], required: true },
      { id: "objetVariation", label: "Objet de la variation", type: "textarea", placeholder: "Changement de site, de formule, d’étiquetage…", required: true },
    ],
    fee: { factor: 0.4 }, documentTitle: (i) => (i === "defavorable" ? "Décision de refus de variation" : "Décision de modification d’AMM"), numeroPrefix: "VAR",
  },
  {
    id: "amm_renouvellement", module: "amm", label: "AMM — renouvellement", short: "Renouv.", niveau: "central",
    description: "Renouvellement quinquennal d’une AMM, réévaluation du rapport bénéfice/risque.",
    stages: CENTRAL_STAGES, categoryGroup: "produit", pieces: ["demande", "amm_ref", "psur", "rcp"], checklist: "renouvellement",
    evaluation: { label: "Réévaluation bénéfice / risque", hint: "Pharmacovigilance et qualité", role: "expert", axes: [{ id: "benefice", label: "Rapport bénéfice / risque" }, { id: "pharmacovigilance", label: "Données de pharmacovigilance (PSUR)" }] },
    signataire: "dg", outcomes: FAV("Renouvellement accordé", "Renouvellement refusé"),
    parent: { types: ["amm_nouveau"], label: "AMM à renouveler" }, subject: TITULAIRE_SUBJECT,
    fields: [{ id: "modifications", label: "Modifications intervenues depuis l’octroi", type: "textarea", placeholder: "Aucune / description" }],
    fee: { factor: 0.6 }, validiteMois: 60, documentTitle: (i) => (i === "defavorable" ? "Décision de refus de renouvellement" : "Décision de renouvellement d’AMM"), numeroPrefix: "REN",
  },
  {
    id: "autorisation_medicale", module: "medicaux", label: "Autorisation d’ouverture d’un établissement médical", short: "Étab. méd.", niveau: "provincial",
    description: "Hôpital, clinique, centre de santé, laboratoire : vérification des exigences, inspection si nécessaire, décision d’autorisation.",
    stages: ["depose", "recevabilite", "paiement", "evaluation", "inspection", "projet", "signature", "notifie", "archive"],
    categoryGroup: "medical", pieces: ["demande", "identite", "site", "plan", "med_personnel", "med_equipements", "med_ordre"], checklist: "medical", grille: "medical",
    evaluation: { label: "Vérification des exigences", hint: "Infrastructure, personnel, équipements", role: "bureau", axes: [{ id: "infrastructure", label: "Infrastructure" }, { id: "personnel", label: "Personnel" }, { id: "equipements", label: "Équipements" }] },
    inspectionOptionnelle: true, signataire: "directeur", outcomes: FAV("Autorisation d’ouverture accordée", "Autorisation refusée"),
    subject: { bloc: "Établissement médical", nom: "Dénomination", adresse: "Adresse", commune: "Commune / ville", responsable: "Médecin directeur", numero: "N° d’inscription à l’Ordre des médecins" },
    fields: [
      { id: "capacite", label: "Capacité (lits / postes)", placeholder: "Ex. 40 lits", required: true },
      { id: "services", label: "Services proposés", placeholder: "Médecine interne, maternité, laboratoire…", required: true },
    ],
    documentTitle: (i) => (i === "defavorable" ? "Décision de refus d’autorisation" : "Autorisation d’ouverture"), numeroPrefix: "AOM",
  },
  {
    id: "import_export", module: "autres", label: "Autorisation d’importation / exportation", short: "Import", niveau: "central",
    description: "Visa d’importation ou d’exportation de produits pharmaceutiques sous AMM.",
    stages: CENTRAL_STAGES, categoryGroup: "produit", pieces: ["demande", "licence_imp", "proforma", "liste_produits"], checklist: "import",
    evaluation: { label: "Contrôle réglementaire", hint: "Statut AMM, quantités, importateur", role: "expert", axes: [{ id: "statut", label: "Statut AMM des produits" }, { id: "quantites", label: "Quantités et besoins" }, { id: "importateur", label: "Conformité de l’importateur" }] },
    signataire: "dg", outcomes: FAV("Autorisation délivrée", "Autorisation refusée"), subject: { ...TITULAIRE_SUBJECT, bloc: "Importateur / exportateur", nom: "Raison sociale" },
    fields: [
      { id: "sens", label: "Opération", type: "select", options: ["Importation", "Exportation"], required: true },
      { id: "produits", label: "Produits et quantités", type: "textarea", placeholder: "Désignation, n° AMM, quantités", required: true },
      { id: "paysProvenance", label: "Pays de provenance / destination", required: true },
      { id: "pointEntree", label: "Point d’entrée / sortie", type: "select", options: ["Aéroport international de N’djili", "Port de Matadi", "Poste frontalier de Kasumbalesa", "Poste frontalier de Goma"], required: true },
    ],
    fee: { fixed: 100 }, validiteMois: 6, documentTitle: (i) => (i === "defavorable" ? "Décision de refus" : "Autorisation d’importation / exportation"), numeroPrefix: "IMP",
  },
  {
    id: "vigilance", module: "autres", label: "Déclaration de vigilance", short: "Vigilance", niveau: "central",
    description: "Notification d’un effet indésirable ou d’un défaut qualité ; évaluation de l’imputabilité ; mesures.",
    stages: ["depose", "recevabilite", "evaluation", "projet", "signature", "notifie", "archive"],
    categoryGroup: "produit", pieces: ["notification"], checklist: "vigilance",
    evaluation: { label: "Évaluation de pharmacovigilance", hint: "Imputabilité, gravité, signal", role: "expert", axes: [{ id: "imputabilite", label: "Imputabilité" }, { id: "gravite", label: "Gravité" }, { id: "signal", label: "Analyse du signal" }] },
    signataire: "dg",
    outcomes: [
      { id: "cloture", label: "Clôture sans mesure", positive: true },
      { id: "mesures", label: "Mesures de minimisation des risques", positive: true },
      { id: "suspension", label: "Suspension / rappel de lots", positive: false },
    ],
    subject: { bloc: "Notificateur", nom: "Structure déclarante", adresse: "Adresse", commune: "Commune / ville", responsable: "Professionnel de santé notificateur", numero: "N° d’Ordre" },
    fields: [
      { id: "produitSuspect", label: "Produit suspect", placeholder: "Nom commercial et DCI", required: true },
      { id: "lot", label: "N° de lot", required: true },
      { id: "effet", label: "Description de l’effet indésirable", type: "textarea", required: true },
      { id: "gravite", label: "Gravité", type: "select", options: ["Non grave", "Grave — hospitalisation", "Grave — mise en jeu du pronostic vital", "Décès"], required: true },
      { id: "dateSurvenue", label: "Date de survenue", type: "date", required: true },
    ],
    documentTitle: () => "Conclusion de pharmacovigilance", numeroPrefix: "PV-VIG",
  },
]

/** Délais d’instruction en jours ouvrables (POS pour l’avis d’implantation ; autres valeurs indicatives, à valider). */
export const DELAIS: Record<ProcedureType, number> = {
  avis_implantation: 60, pv_constat: 60, licence: 30, enregistrement_produit: 120, amm_nouveau: 150,
  amm_variation: 60, amm_renouvellement: 90, autorisation_medicale: 60, import_export: 15, vigilance: 30,
}

export const procDef = (t: ProcedureType) => PROCEDURE_DEFS.find((p) => p.id === t)!
export const proceduresOf = (m: ModuleId) => PROCEDURE_DEFS.filter((p) => p.module === m)

/** Compatibilité : libellés courts par procédure. */
export const PROCEDURES = Object.fromEntries(PROCEDURE_DEFS.map((p) => [p.id, { label: p.label, short: p.short, description: p.description }])) as Record<
  ProcedureType,
  { label: string; short: string; description: string }
>

export function categoriesFor(t: ProcedureType) {
  return CATEGORIES.filter((c) => c.group === procDef(t).categoryGroup)
}

export function requiredPieces(t: ProcedureType, cat: CategoryId) {
  return procDef(t)
    .pieces.map((id) => PIECE_TYPES.find((p) => p.id === id)!)
    .filter((p) => !p.categories || p.categories.includes(cat))
}

export const checklistFor = (t: ProcedureType): CheckItem[] => CHECKLISTS[procDef(t).checklist]
export const grilleFor = (t: ProcedureType): GrilleItem[] => GRILLES[procDef(t).grille ?? "pharma"]

export function feeFor(t: ProcedureType, cat: CategoryId) {
  const def = procDef(t)
  if (!def.stages.includes("paiement")) return 0
  if (def.fee?.fixed) return def.fee.fixed
  return Math.round(categoryById(cat).redevance * (def.fee?.factor ?? 1))
}

/** Étape suivante dans le circuit de la procédure. */
export function nextStatus(d: Pick<Dossier, "type">, from: Status): Status {
  const st = procDef(d.type).stages
  const i = st.indexOf(from === "complements" ? "recevabilite" : from)
  return st[Math.min(i + 1, st.length - 1)]
}

export const outcomeOf = (d: Dossier) => procDef(d.type).outcomes.find((o) => o.id === d.decision?.issue)
export const isPositive = (d: Dossier) => !!outcomeOf(d)?.positive

export function subjectTitle(d: Dossier) {
  const x = d.details ?? {}
  if (x.nomCommercial) return `${x.nomCommercial}${x.dosage ? ` ${x.dosage}` : ""}`
  if (x.produitSuspect) return `Notification — ${x.produitSuspect}`
  if (x.produits) return `${x.sens ?? "Importation"} — ${x.produits.split(/\r?\n/)[0]}`
  return d.etablissement.nom
}

export function subjectSubtitle(d: Dossier) {
  const x = d.details ?? {}
  if (x.nomCommercial) return `${x.dci ?? ""}${x.forme ? ` · ${x.forme}` : ""} — ${d.etablissement.nom}`
  if (x.produitSuspect) return `${x.gravite ?? ""} — ${d.etablissement.nom}`
  if (x.produits) return `${d.etablissement.nom} · ${x.paysProvenance ?? ""} · ${x.pointEntree ?? ""}`
  return `${d.etablissement.commune}, ${d.province}`
}

/** Libellé d’une étape dans le contexte d’une procédure. */
export function stageLabel(t: ProcedureType, s: Status): { label: string; hint: string } {
  const def = procDef(t)
  const base: Record<Status, { label: string; hint: string }> = {
    brouillon: { label: "Brouillon", hint: "" },
    depose: { label: "Réception", hint: "Numérotation, accusé et orientation" },
    recevabilite: { label: "Recevabilité", hint: "Liste de contrôle et compléments" },
    complements: { label: "Compléments", hint: "Délai suspendu" },
    paiement: { label: "Paiement", hint: "Invitation et validation de la redevance" },
    evaluation: { label: def.evaluation?.label ?? "Évaluation", hint: def.evaluation?.hint ?? "" },
    inspection: { label: def.inspectionOptionnelle ? "Inspection (si nécessaire)" : "Inspection", hint: "Mission, grille, PV" },
    cpop: { label: def.commission?.label ?? "Avis collégial", hint: "Avis favorable / défavorable motivé" },
    projet: { label: "Projet de décision", hint: "Motivation et visas" },
    signature: { label: "Signature", hint: def.signataire === "dg" ? "Direction générale" : "Directeur provincial" },
    notifie: { label: "Notification", hint: "Preuve d’envoi et de réception" },
    archive: { label: "Archivage", hint: "Classement et conservation" },
  }
  return base[s]
}
