export type Role =
  | "demandeur"
  | "secretariat"
  | "bureau"
  | "expert"
  | "inspecteur"
  | "finance"
  | "cpop"
  | "commission"
  | "directeur"
  | "dg"

export type ModuleId = "etablissements" | "produits" | "amm" | "medicaux" | "autres"

export type ProcedureType =
  | "avis_implantation"
  | "pv_constat"
  | "enregistrement_produit"
  | "amm_nouveau"
  | "amm_variation"
  | "amm_renouvellement"
  | "autorisation_medicale"
  | "import_export"
  | "vigilance"
  | "licence"

/** Étapes du moteur de workflow (chaque procédure en assemble un sous-ensemble ordonné). */
export type Status =
  | "brouillon"
  | "depose"
  | "recevabilite"
  | "complements"
  | "paiement"
  | "evaluation"
  | "inspection"
  | "cpop"
  | "projet"
  | "signature"
  | "notifie"
  | "archive"

export type CategoryId = string

export type CheckValue = "ok" | "ko" | "na" | null
export type GrilleValue = "conforme" | "a_corriger" | "non_conforme" | null
export type Conclusion = "favorable" | "reserves" | "defavorable"

export interface User {
  id: string
  nom: string
  role: Role
  province: string | null // null = niveau central / toutes provinces
  titre: string
  initiales: string
}

export interface Piece {
  id: string
  typeId: string
  nom: string
  taille: number
  hash: string
  version: number
  deposePar: string
  deposeLe: string
  visibilite: "demandeur" | "interne"
}

export interface Suspension {
  debut: string
  fin?: string
  motif: string
}

export interface AuditEvent {
  id: string
  dossierId: string
  at: string
  actorId: string
  role: Role
  action: string
  comment?: string
  from?: Status
  to?: Status
  prevHash: string
  hash: string
}

export interface Dossier {
  id: string
  type: ProcedureType
  parentId?: string
  status: Status
  province: string
  categorie: CategoryId
  /** Sujet de la demande : établissement, titulaire (laboratoire) ou structure déclarante. */
  etablissement: {
    nom: string
    adresse: string
    commune: string
    gps?: { lat: number; lng: number }
  }
  promoteur: { nom: string; telephone: string; email: string }
  pharmacien: { nom: string; numeroOrdre: string }
  /** Champs spécifiques à la procédure (produit, variation, importation, vigilance…). */
  details?: Record<string, string>
  ownerId: string
  createdAt: string
  submittedAt?: string
  receivedAt?: string
  accuseRef?: string
  assigneeId?: string
  pieces: Piece[]
  checklist: Record<string, CheckValue>
  complementsDemandes?: string
  paiement?: {
    montant: number
    reference: string
    inviteLe?: string
    preuve?: string
    valideLe?: string
  }
  evaluation?: {
    axes: Record<string, { conclusion: Conclusion; rapport: string; par: string; le: string }>
    clotureLe?: string
  }
  mission?: {
    ordre: string
    date: string
    inspecteurs: string[]
  }
  inspectionDispensee?: { motif: string; le: string; par: string }
  inspection?: {
    grille: Record<string, { v: GrilleValue; obs: string }>
    observations: string
    photos: number
    gps?: { lat: number; lng: number }
    signature?: string
    signeLe?: string
    pvVersion: number
  }
  /** Avis collégial : CPOP, commission d’enregistrement, commission AMM… */
  cpop?: {
    avis: "favorable" | "defavorable"
    motif: string
    le: string
    par: string
  }
  decision?: {
    issue: string
    motivation: string
    projetLe: string
    visas: { role: Role; par: string; le: string }[]
    signeLe?: string
    signePar?: string
    codeVerif?: string
    numero?: string
    validiteFin?: string
    retrait?: { le: string; motif: string; par: string }
  }
  notification?: {
    envoyeLe: string
    recuLe?: string
    canal: string
  }
  suspensions: Suspension[]
}
