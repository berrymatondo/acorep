import type { ModuleId, Role, Status, User } from "./types"

export const PROVINCES = [
  "Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Mai-Ndombe", "Kasaï", "Kasaï-Central",
  "Kasaï-Oriental", "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Ituri",
  "Haut-Uele", "Bas-Uele", "Tshopo", "Mongala", "Nord-Ubangi", "Sud-Ubangi", "Équateur",
  "Tshuapa", "Tanganyika", "Haut-Lomami", "Lualaba", "Haut-Katanga",
] as const

export const PROVINCE_CODES: Record<string, string> = {
  Kinshasa: "KIN", "Kongo-Central": "KCE", "Haut-Katanga": "HKA", Lualaba: "LUA",
  "Nord-Kivu": "NKI", "Sud-Kivu": "SKI", Tshopo: "TSH", "Kasaï-Central": "KAC",
  Ituri: "ITU", Équateur: "EQU", "Kasaï-Oriental": "KAO", Tanganyika: "TAN",
}
export const provinceCode = (p: string) => PROVINCE_CODES[p] ?? p.slice(0, 3).toUpperCase()

/* ───────────────────────── Modules RIMS ───────────────────────── */

export interface ModuleDef {
  id: ModuleId
  label: string
  short: string
  description: string
  points: string[]
  deliverable: string
  color: string
}

/** Ordre fixe des couleurs de série (palette validée) : la couleur suit le module. */
export const MODULES: ModuleDef[] = [
  {
    id: "etablissements", label: "Établissements pharmaceutiques", short: "Étab. pharmaceutiques",
    description: "Avis d’implantation et PV de constat des lieux des officines, dépôts, grossistes et fabricants.",
    points: ["Avis d’implantation", "Inspection et PV de constat", "Licence d’exploitation"],
    deliverable: "Établissement pharmaceutique autorisé", color: "var(--series-1)",
  },
  {
    id: "produits", label: "Enregistrement des produits pharmaceutiques", short: "Enregistrement produits",
    description: "Dépôt du dossier (qualité, sécurité, efficacité), évaluation par les experts, décision d’enregistrement.",
    points: ["Dépôt du dossier (qualité, sécurité, efficacité)", "Évaluation par les experts", "Décision d’enregistrement"],
    deliverable: "Produit pharmaceutique enregistré", color: "var(--series-2)",
  },
  {
    id: "amm", label: "Autorisation de mise sur le marché (AMM)", short: "AMM",
    description: "Demande d’AMM (nouveau produit, variation, renouvellement), évaluation scientifique et réglementaire.",
    points: ["Demande d’AMM (nouveau produit, variation, renouvellement)", "Évaluation scientifique et réglementaire", "Octroi, renouvellement, modification ou retrait"],
    deliverable: "AMM délivrée", color: "var(--series-3)",
  },
  {
    id: "medicaux", label: "Ouverture d’établissements médicaux", short: "Établissements médicaux",
    description: "Hôpital, clinique, centre de santé, laboratoire : vérification des exigences, inspection si nécessaire, décision d’autorisation.",
    points: ["Demande d’autorisation (hôpital, clinique, centre de santé, laboratoire…)", "Vérification des exigences (infrastructure, personnel, équipements…)", "Inspection (si nécessaire) et décision d’autorisation"],
    deliverable: "Établissement médical autorisé (ouvert)", color: "var(--series-4)",
  },
  {
    id: "autres", label: "Autres procédures", short: "Autres procédures",
    description: "Importation / exportation, vigilance, licences.",
    points: ["Importation / exportation", "Vigilance (effets indésirables)", "Licences"],
    deliverable: "Autres autorisations et attestations", color: "var(--series-5)",
  },
]
export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!

/* ───────────────────────── Catégories ───────────────────────── */

export type CategoryGroup = "pharma" | "produit" | "medical"

export interface Category {
  id: string
  group: CategoryGroup
  label: string
  description: string
  bp: string
  redevance: number
}

export const CATEGORIES: Category[] = [
  // Établissements pharmaceutiques
  { id: "officine", group: "pharma", label: "Officine pharmaceutique", description: "Pharmacie d’officine ouverte au public", bp: "BPP / GPP", redevance: 250 },
  { id: "depot", group: "pharma", label: "Dépôt pharmaceutique", description: "Dépôt de médicaments en zone rurale ou périurbaine", bp: "BPP / GPP", redevance: 150 },
  { id: "grossiste", group: "pharma", label: "Grossiste répartiteur", description: "Distribution en gros de produits pharmaceutiques", bp: "BPD / GDP", redevance: 900 },
  { id: "fabrication", group: "pharma", label: "Établissement de fabrication", description: "Unité de production pharmaceutique", bp: "BPF / GMP", redevance: 2500 },
  { id: "importateur", group: "pharma", label: "Importateur / distributeur", description: "Importation et distribution de produits de santé", bp: "BPD / BPI", redevance: 1200 },
  { id: "hospitaliere", group: "pharma", label: "Pharmacie hospitalière", description: "Pharmacie à usage intérieur d’une structure de soins", bp: "BPP / GPP", redevance: 200 },
  // Produits
  { id: "generique", group: "produit", label: "Médicament générique", description: "Essentiellement similaire à une spécialité de référence", bp: "BPF / GMP", redevance: 500 },
  { id: "innovant", group: "produit", label: "Médicament innovant", description: "Nouvelle substance active ou nouvelle indication", bp: "BPF / GMP", redevance: 1500 },
  { id: "biologique", group: "produit", label: "Produit biologique / vaccin", description: "Vaccins, sérums, biosimilaires", bp: "BPF / GMP", redevance: 2000 },
  { id: "traditionnel", group: "produit", label: "Médicament traditionnel amélioré", description: "Phytomédicaments et pharmacopée traditionnelle", bp: "BPF / GMP", redevance: 300 },
  { id: "dispositif", group: "produit", label: "Dispositif médical", description: "Dispositifs et consommables médicaux", bp: "Normes ISO 13485", redevance: 400 },
  // Établissements médicaux
  { id: "hopital", group: "medical", label: "Hôpital", description: "Hôpital général ou de référence", bp: "Normes sanitaires", redevance: 800 },
  { id: "clinique", group: "medical", label: "Clinique / polyclinique", description: "Établissement de soins privé", bp: "Normes sanitaires", redevance: 500 },
  { id: "centre_sante", group: "medical", label: "Centre de santé", description: "Soins de santé primaires", bp: "Normes sanitaires", redevance: 200 },
  { id: "laboratoire", group: "medical", label: "Laboratoire d’analyses", description: "Biologie médicale", bp: "BPL / ISO 15189", redevance: 300 },
  { id: "imagerie", group: "medical", label: "Centre de diagnostic / imagerie", description: "Radiologie, échographie, scanner", bp: "Radioprotection", redevance: 600 },
]
export const categoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? { id, group: "pharma" as const, label: id, description: "", bp: "—", redevance: 0 }

/* ───────────────────────── Pièces ───────────────────────── */

export interface PieceType {
  id: string
  label: string
  hint: string
  categories?: string[]
}

export const PIECE_TYPES: PieceType[] = [
  { id: "demande", label: "Demande signée (formulaire)", hint: "Formulaire daté et signé par le demandeur" },
  { id: "identite", label: "Pièce d’identité du promoteur", hint: "Carte d’électeur, passeport ou équivalent" },
  { id: "ordre", label: "Attestation d’inscription à l’Ordre", hint: "Pharmacien responsable — CNOP" },
  { id: "site", label: "Justificatif d’occupation du site", hint: "Titre de propriété ou contrat de bail" },
  { id: "plan", label: "Plan de localisation et des locaux", hint: "Plan coté, distances avec les établissements voisins" },
  { id: "statuts", label: "Statuts de la société / RCCM", hint: "Personne morale uniquement", categories: ["grossiste", "fabrication", "importateur"] },
  { id: "personnel", label: "Liste du personnel qualifié", hint: "CV et diplômes", categories: ["grossiste", "fabrication", "importateur", "hospitaliere"] },
  { id: "avis_ref", label: "Avis d’implantation favorable", hint: "Copie de l’avis notifié" },
  { id: "equipements", label: "Inventaire des équipements", hint: "Chaîne du froid, rayonnages, sécurité" },
  { id: "ctd1", label: "Module 1 — Dossier administratif", hint: "Lettre de demande, formulaire, autorisations du titulaire" },
  { id: "ctd2", label: "Module 2 — Résumés", hint: "Résumés qualité, non clinique et clinique" },
  { id: "ctd3", label: "Module 3 — Qualité", hint: "Substance active, produit fini, stabilité" },
  { id: "ctd4", label: "Module 4 — Sécurité (non clinique)", hint: "Pharmacologie, toxicologie" },
  { id: "ctd5", label: "Module 5 — Efficacité (clinique)", hint: "Études cliniques, bioéquivalence" },
  { id: "rcp", label: "RCP, notice et étiquetage", hint: "En français, conformes au modèle" },
  { id: "bpf", label: "Certificat BPF du fabricant", hint: "Délivré par l’autorité du pays de fabrication" },
  { id: "cpp", label: "Certificat de produit pharmaceutique (CPP)", hint: "Modèle OMS" },
  { id: "echantillons", label: "Échantillons et certificat d’analyse", hint: "Lot représentatif" },
  { id: "amm_ref", label: "Décision d’AMM en vigueur", hint: "Copie de l’AMM concernée" },
  { id: "variation_doc", label: "Dossier de variation", hint: "Description, justification et données à l’appui" },
  { id: "psur", label: "Rapport périodique de sécurité (PSUR)", hint: "Depuis l’octroi ou le dernier renouvellement" },
  { id: "med_personnel", label: "Liste du personnel médical et paramédical", hint: "Diplômes et inscriptions aux Ordres" },
  { id: "med_equipements", label: "Inventaire du plateau technique", hint: "Équipements biomédicaux, stérilisation" },
  { id: "med_ordre", label: "Attestation du médecin directeur", hint: "Inscription au Conseil de l’Ordre des médecins" },
  { id: "licence_imp", label: "Licence d’importateur / exportateur", hint: "En cours de validité" },
  { id: "proforma", label: "Facture pro forma", hint: "Fournisseur, quantités, valeurs" },
  { id: "liste_produits", label: "Liste des produits et n° d’AMM", hint: "Avec numéros de lots si connus" },
  { id: "notification", label: "Fiche de notification d’effet indésirable", hint: "Patient, produit suspect, description de l’effet" },
  { id: "autorisation_ref", label: "Autorisation d’ouverture / PV de constat", hint: "Document de référence de l’établissement" },
]

/* ───────────────────────── Contrôles ───────────────────────── */

export interface CheckItem {
  id: string
  label: string
}

export const CHECKLISTS: Record<string, CheckItem[]> = {
  pharma: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "identite", label: "Pièces d’identification conformes" },
    { id: "site", label: "Justificatif du site valide" },
    { id: "pharmacien", label: "Pharmacien responsable inscrit à l’Ordre" },
    { id: "plan", label: "Plan et distances réglementaires" },
    { id: "doublon", label: "Absence de doublon / dossier concurrent" },
  ],
  produit: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "ctd", label: "Dossier CTD complet (modules 1 à 5)" },
    { id: "rcp", label: "RCP et notice conformes, en français" },
    { id: "bpf", label: "Certificat BPF du fabricant valide" },
    { id: "echantillons", label: "Échantillons et certificats d’analyse fournis" },
    { id: "doublon", label: "Absence de doublon (DCI, dosage, titulaire)" },
  ],
  variation: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "amm", label: "AMM de référence en vigueur" },
    { id: "classification", label: "Classification de la variation justifiée" },
    { id: "justificatifs", label: "Documents justificatifs fournis" },
  ],
  renouvellement: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "amm", label: "AMM de référence non expirée" },
    { id: "psur", label: "Rapport périodique de sécurité fourni" },
    { id: "delai", label: "Demande déposée dans le délai réglementaire" },
  ],
  medical: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "identite", label: "Identité du promoteur conforme" },
    { id: "site", label: "Justificatif du site valide" },
    { id: "personnel", label: "Personnel qualifié déclaré" },
    { id: "plan", label: "Plan des locaux fourni" },
    { id: "ordre", label: "Médecin directeur inscrit à l’Ordre" },
  ],
  import: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "licence", label: "Licence d’importateur valide" },
    { id: "amm", label: "Produits couverts par une AMM en vigueur" },
    { id: "proforma", label: "Facture pro forma conforme" },
  ],
  vigilance: [
    { id: "complet", label: "Notification complète (patient, produit, effet, notificateur)" },
    { id: "produit", label: "Produit suspect identifié (nom, lot)" },
    { id: "doublon", label: "Absence de doublon de notification" },
  ],
  licence: [
    { id: "demande", label: "Demande signée et datée" },
    { id: "autorisation", label: "Autorisation d’ouverture / PV de constat valide" },
    { id: "pharmacien", label: "Pharmacien responsable inscrit à l’Ordre" },
    { id: "site", label: "Site inchangé depuis l’autorisation" },
  ],
}

/* ───────────────────────── Grilles d’inspection ───────────────────────── */

export interface GrilleItem {
  id: string
  section: string
  label: string
}

export const GRILLES: Record<string, GrilleItem[]> = {
  /** Grille de visite des établissements pharmaceutiques (annexe 04). */
  pharma: [
    { id: "identification", section: "Localisation", label: "Identification et localisation du site" },
    { id: "accessibilite", section: "Localisation", label: "Accessibilité et environnement immédiat" },
    { id: "distances", section: "Localisation", label: "Respect des distances réglementaires" },
    { id: "locaux", section: "Infrastructure", label: "Locaux : surface, cloisonnement, revêtements" },
    { id: "equipements", section: "Infrastructure", label: "Équipements et rayonnages" },
    { id: "froid", section: "Infrastructure", label: "Chaîne du froid et température" },
    { id: "securite", section: "Hygiène & sécurité", label: "Sécurité incendie et anti-intrusion" },
    { id: "hygiene", section: "Hygiène & sécurité", label: "Hygiène, ventilation, éclairage" },
    { id: "personnel", section: "Personnel", label: "Présence et qualification du personnel" },
  ],
  /** Grille de visite des établissements médicaux. */
  medical: [
    { id: "identification", section: "Site", label: "Identification et accessibilité du site" },
    { id: "circuits", section: "Site", label: "Circuits patients, propre / sale" },
    { id: "plateau", section: "Plateau technique", label: "Plateau technique et équipements biomédicaux" },
    { id: "sterilisation", section: "Plateau technique", label: "Stérilisation et hygiène hospitalière" },
    { id: "dechets", section: "Hygiène & sécurité", label: "Gestion des déchets biomédicaux" },
    { id: "securite", section: "Hygiène & sécurité", label: "Sécurité incendie, eau et électricité" },
    { id: "personnel", section: "Personnel", label: "Personnel médical et paramédical présent" },
  ],
}

/* ───────────────────────── Acteurs ───────────────────────── */

export const ROLES: Record<Role, { label: string; short: string; description: string }> = {
  demandeur: { label: "Demandeur / titulaire", short: "Demandeur", description: "Créer, compléter, soumettre et suivre ses dossiers" },
  secretariat: { label: "Secrétariat", short: "Secrétariat", description: "Réceptionner, numéroter, accuser réception, orienter, archiver" },
  bureau: { label: "Bureau instructeur", short: "Bureau", description: "Contrôler la recevabilité, instruire, préparer la décision" },
  expert: { label: "Expert évaluateur", short: "Expert", description: "Évaluer la qualité, la sécurité, l’efficacité et la vigilance" },
  inspecteur: { label: "Inspecteur", short: "Inspecteur", description: "Visiter, saisir constats et preuves, signer le PV" },
  finance: { label: "Cellule financière", short: "Finances", description: "Émettre l’invitation à payer, valider le justificatif" },
  cpop: { label: "CPOP", short: "CPOP", description: "Rendre l’avis sur l’implantation des établissements pharmaceutiques" },
  commission: { label: "Commission d’experts", short: "Commission", description: "Avis collégial sur l’enregistrement et l’AMM" },
  directeur: { label: "Directeur provincial", short: "Directeur", description: "Signer les décisions provinciales, notifier" },
  dg: { label: "Direction générale", short: "DG", description: "Signer les décisions nationales, superviser, auditer" },
}

export const USERS: User[] = [
  { id: "u-dem", nom: "Ph. Grâce Mbuyi", role: "demandeur", province: "Kinshasa", titre: "Pharmacienne promotrice", initiales: "GM" },
  { id: "u-lab", nom: "Dr Patrice Mukuna", role: "demandeur", province: "Kinshasa", titre: "Pharmacien responsable — Lisanga Labs", initiales: "PM" },
  { id: "u-sec", nom: "Patrick Ilunga", role: "secretariat", province: "Kinshasa", titre: "Secrétaire", initiales: "PI" },
  { id: "u-bur", nom: "Dr Aimée Nsimba", role: "bureau", province: "Kinshasa", titre: "Cheffe du bureau instructeur", initiales: "AN" },
  { id: "u-exp", nom: "Dr Benjamin Tshibangu", role: "expert", province: "Kinshasa", titre: "Expert évaluateur — qualité", initiales: "BT" },
  { id: "u-exp2", nom: "Dr Claire Mbala", role: "expert", province: "Kinshasa", titre: "Experte — sécurité, efficacité, vigilance", initiales: "CM" },
  { id: "u-ins", nom: "Ph. Jonathan Kasongo", role: "inspecteur", province: "Kinshasa", titre: "Inspecteur principal", initiales: "JK" },
  { id: "u-ins2", nom: "Ph. Mireille Tshala", role: "inspecteur", province: "Kinshasa", titre: "Inspectrice", initiales: "MT" },
  { id: "u-fin", nom: "Ruth Mukendi", role: "finance", province: "Kinshasa", titre: "Agente de la cellule financière", initiales: "RM" },
  { id: "u-cpo", nom: "Pr. Didier Lokwa", role: "cpop", province: "Kinshasa", titre: "Président du CPOP", initiales: "DL" },
  { id: "u-com", nom: "Pr. Hélène Kabeya", role: "commission", province: "Kinshasa", titre: "Présidente de la commission d’experts", initiales: "HK" },
  { id: "u-dir", nom: "Dr Joseph Mavungu", role: "directeur", province: "Kinshasa", titre: "Directeur provincial", initiales: "JM" },
  { id: "u-dg", nom: "Dr Esther Bolamba", role: "dg", province: null, titre: "Direction générale — Assurance qualité", initiales: "EB" },
  { id: "u-dir-hk", nom: "Dr Serge Kalala", role: "directeur", province: "Haut-Katanga", titre: "Directeur provincial", initiales: "SK" },
]
export const userById = (id?: string) => USERS.find((u) => u.id === id)

export const STATUS_META: Record<Status, { label: string; tone: string; dot: string }> = {
  brouillon: { label: "Brouillon", tone: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  depose: { label: "Déposé", tone: "bg-sky-500/12 text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  recevabilite: { label: "Recevabilité", tone: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  complements: { label: "Compléments", tone: "bg-amber-500/15 text-amber-800 dark:text-amber-300", dot: "bg-amber-500" },
  paiement: { label: "Paiement", tone: "bg-violet-500/12 text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  evaluation: { label: "Évaluation", tone: "bg-teal-500/12 text-teal-700 dark:text-teal-300", dot: "bg-teal-500" },
  inspection: { label: "Inspection", tone: "bg-cyan-500/12 text-cyan-800 dark:text-cyan-300", dot: "bg-cyan-500" },
  cpop: { label: "Avis collégial", tone: "bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300", dot: "bg-fuchsia-500" },
  projet: { label: "Projet de décision", tone: "bg-blue-500/12 text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  signature: { label: "À signer", tone: "bg-orange-500/12 text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  notifie: { label: "Notifié", tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  archive: { label: "Archivé", tone: "bg-stone-500/12 text-stone-700 dark:text-stone-300", dot: "bg-stone-500" },
}

export const TEXTES = [
  { ref: "Ordonnance-loi n° 95-018", objet: "Exercice de la pharmacie — Ordre des pharmaciens", statut: "À confirmer (service juridique)" },
  { ref: "Loi n° 18/035", objet: "Principes fondamentaux relatifs à l’organisation de la santé publique", statut: "À confirmer (service juridique)" },
  { ref: "Arrêté n° 1250/CAB/MIN/S/AJ/01", objet: "Implantation des établissements pharmaceutiques et textes modificatifs", statut: "À confirmer (service juridique)" },
  { ref: "AQ-POS-ENR-001-26 rév. 00", objet: "POS — Instruction des avis d’implantation et PV de constat des lieux", statut: "En vigueur" },
  { ref: "AQ-PGI-001-26", objet: "Procédure de gestion des informations documentées", statut: "En vigueur" },
  { ref: "OMS — GBT", objet: "Global Benchmarking Tool des autorités de réglementation", statut: "Référentiel" },
  { ref: "Format CTD (ICH M4)", objet: "Structure du dossier d’enregistrement et d’AMM", statut: "Référentiel" },
  { ref: "POS enregistrement / AMM / vigilance", objet: "Procédures des modules complémentaires", statut: "À rédiger (Lot 3)" },
]

export const ANNEXES = [
  { n: "01", titre: "Formulaire de demande d’avis d’implantation" },
  { n: "02", titre: "Liste de contrôle de recevabilité" },
  { n: "03", titre: "Invitation à payer" },
  { n: "04", titre: "Grille de visite des lieux" },
  { n: "05", titre: "Ordre de mission" },
  { n: "06", titre: "Modèle d’avis d’implantation" },
  { n: "07", titre: "Modèle de procès-verbal de constat des lieux" },
  { n: "08", titre: "Plan de classement et d’archivage" },
  { n: "09", titre: "Registre des demandes" },
]
