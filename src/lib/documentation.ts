import type { Role } from "./types"

/**
 * Contenu de la page /documentation : description détaillée de chaque écran du
 * RIMS. Les listes « vivantes » (statuts, rôles, modules, procédures) sont
 * générées depuis les référentiels dans la vue, pour rester synchronisées.
 */

export type DocAccess = "tous" | "public" | Role[]

export interface DocFeature {
  titre: string
  points: string[]
}

export interface DocPage {
  id: string
  groupe: "Accueil" | "Pilotage" | "Instruction" | "Contrôle" | "Public"
  titre: string
  route: string
  /** Lien ouvrable (absent pour les routes paramétrées sans exemple). */
  href?: string
  icon: string
  acces: DocAccess
  resume: string
  fonctionnalites: DocFeature[]
  astuces?: string[]
  exigences?: string[]
}

const AGENTS: Role[] = ["secretariat", "bureau", "expert", "inspecteur", "finance", "cpop", "commission", "directeur", "dg"]

export const DOC_PAGES: DocPage[] = [
  {
    id: "accueil",
    groupe: "Accueil",
    titre: "Page d’accueil",
    route: "/",
    href: "/",
    icon: "home",
    acces: "public",
    resume:
      "Vitrine publique du RIMS : elle présente la plateforme, les modules réglementaires et permet d’entrer dans la démonstration avec le profil de son choix.",
    fonctionnalites: [
      {
        titre: "Présentation",
        points: [
          "Bandeau principal avec un dossier « vivant » animé qui parcourt les étapes du circuit (dépôt → archivage) et son compteur de jours ouvrables restants.",
          "Indicateurs clés : délai POS de 60 jours ouvrables pour l’avis, nombre de procédures réglementaires, 100 % des actions historisées.",
          "Section « Processus » : le circuit d’instruction expliqué étape par étape.",
          "Section « Modules » : les cinq modules (établissements pharmaceutiques, enregistrement des produits, AMM, établissements médicaux, autres procédures), leurs procédures et leurs délivrables, générés depuis le paramétrage.",
          "Section « Sécurité » : traçabilité, journal chaîné SHA-256, documents vérifiables par QR code, cloisonnement par province.",
        ],
      },
      {
        titre: "Entrer dans la plateforme",
        points: [
          "Grille « Entrez avec un profil » : un clic sur une carte (demandeur, laboratoire, secrétariat, bureau, expert, inspecteur, finances, CPOP, commission, directeur, DG) ouvre le tableau de bord avec ce profil.",
          "Bouton « Accéder » / « Explorer la plateforme » : ouvre le tableau de bord avec le profil courant.",
          "Bouton « Vérifier un document » : accès direct au service public de vérification.",
          "Bascule clair / sombre dans l’en-tête.",
        ],
      },
    ],
    astuces: ["Lien direct avec un profil : ajoutez ?as=<identifiant> à n’importe quelle URL (ex. /dossiers/ACR-2026-0081?as=u-exp)."],
  },
  {
    id: "tableau-de-bord",
    groupe: "Pilotage",
    titre: "Tableau de bord",
    route: "/tableau-de-bord",
    href: "/tableau-de-bord",
    icon: "dashboard",
    acces: "tous",
    resume:
      "Point d’entrée de chaque profil. Le contenu s’adapte au rôle : portail de suivi pour le demandeur, supervision et indicateurs de délai pour les agents.",
    fonctionnalites: [
      {
        titre: "Vue demandeur (portail)",
        points: [
          "Liste « Mes dossiers » avec statut, procédure, progression dans le circuit et délai restant.",
          "Mise en avant des dossiers qui attendent une action du demandeur (compléments à fournir, justificatif de paiement, accusé de réception).",
          "Suggestions de suites logiques : PV de constat après un avis d’implantation favorable, variation ou renouvellement d’une AMM en vigueur.",
          "Raccourci « Nouvelle demande » et accès aux documents signés vérifiables.",
        ],
      },
      {
        titre: "Vue agents (supervision)",
        points: [
          "Bandeau d’accueil personnalisé : nombre de dossiers qui attendent votre action, rôle et province ; boutons « Ma file de travail » et « Consulter les dossiers ».",
          "Quatre indicateurs animés : dossiers en cours (et total du périmètre), à compléter (délai suspendu), inspections programmées (et missions à planifier), échéances proches (≥ 60 % du délai consommé).",
          "Graphique « Flux réglementaire » : dépôts reçus et décisions notifiées par semaine sur 12 semaines, avec infobulle au survol.",
          "« Respect des délais POS » : part des avis notifiés sous 60 jours ouvrables, délai moyen et nombre de suspensions.",
          "« Dossiers par étape » : barres cliquables qui ouvrent la liste filtrée sur l’étape choisie.",
          "« Dossiers par module » : répartition colorée selon les cinq modules.",
          "« Échéances à surveiller » : dossiers triés par jours ouvrables restants, avec anneau de délai.",
          "« Activité récente » : derniers événements du journal d’audit dans votre périmètre.",
          "Profil DG : « Supervision nationale » et « Activité par province » (le DG voit toutes les provinces).",
        ],
      },
    ],
    exigences: ["F08 Tableaux de bord, délais, audit, recherche"],
  },
  {
    id: "travail",
    groupe: "Pilotage",
    titre: "File de travail",
    route: "/travail",
    href: "/travail",
    icon: "inbox",
    acces: AGENTS,
    resume:
      "La liste des dossiers qui requièrent votre action, et seulement eux, triés par urgence de délai. C’est l’écran de travail quotidien des agents.",
    fonctionnalites: [
      {
        titre: "Contenu",
        points: [
          "Un dossier apparaît ici lorsque son étape courante relève de votre rôle et de votre province (par ex. recevabilité → bureau, paiement → finances, évaluation → expert, avis collégial → CPOP ou commission, signature → directeur ou DG).",
          "Tri automatique par jours ouvrables restants : le plus urgent en haut.",
          "Chaque carte indique le numéro, la procédure, l’objet (établissement ou produit), la catégorie, la localisation, la date de réception, l’anneau de délai et la « Prochaine étape » à réaliser (ex. « Rapports d’évaluation (1/3) »).",
          "Le compteur à côté de « File de travail » dans le menu latéral indique en permanence le nombre de dossiers en attente.",
          "L’en-tête rappelle combien d’autres dossiers sont en cours dans votre périmètre sans action de votre part.",
        ],
      },
      {
        titre: "Navigation",
        points: [
          "Un clic sur une carte ouvre la fiche du dossier, directement sur le panneau d’actions.",
          "File vide : message « Tout est à jour » et invitation à changer de profil pour faire avancer le circuit.",
        ],
      },
    ],
  },
  {
    id: "modules",
    groupe: "Pilotage",
    titre: "Modules réglementaires",
    route: "/modules",
    href: "/modules",
    icon: "boxes",
    acces: "tous",
    resume:
      "Vue d’ensemble des cinq modules du RIMS et de leurs procédures, avec les volumes de votre périmètre. Elle reflète le paramétrage du moteur de workflow.",
    fonctionnalites: [
      {
        titre: "Par module",
        points: [
          "Carte colorée par module avec ses missions principales (dépôt, évaluation, inspection, décision…).",
          "Trois compteurs : dossiers en instruction, dossiers qui attendent votre action, titres en vigueur au registre.",
          "Liste des procédures du module avec nombre d’étapes, délai d’instruction en jours ouvrables, niveau (provincial ou central) et nombre de dossiers.",
          "Délivrable du module (avis, licence, décision d’enregistrement, AMM, autorisation…).",
        ],
      },
      {
        titre: "Actions",
        points: [
          "Demandeur : bouton de dépôt par procédure, qui ouvre l’assistant pré-rempli. Les variations et renouvellements portent la mention « via un titre existant » (ils se déposent à partir d’une AMM).",
          "Agents : liens vers la liste des dossiers filtrée sur le module et vers les registres.",
        ],
      },
    ],
    exigences: ["F10 AMM, enregistrement, autres autorisations"],
  },
  {
    id: "dossiers",
    groupe: "Instruction",
    titre: "Dossiers (registre des demandes)",
    route: "/dossiers",
    href: "/dossiers",
    icon: "folder",
    acces: "tous",
    resume:
      "Registre de toutes les demandes visibles dans votre périmètre (annexe 09) : recherche, filtres combinables, tri et export. Pour le demandeur, il s’intitule « Mes dossiers ».",
    fonctionnalites: [
      {
        titre: "Filtres",
        points: [
          "Puces de module (avec couleur et compteur) : Tous les modules, Établissements, Produits, AMM, Médicaux, Autres.",
          "Puces de statut : Tous, Déposé, Recevabilité, Compléments, Paiement, Évaluation, Inspection, Avis collégial, Projet, Signature, Notifié, Archivé — chacune avec son compteur.",
          "Recherche plein texte : numéro, produit, DCI, établissement, commune…",
          "Listes déroulantes : procédure (limitée au module choisi), catégorie (limitée aux procédures retenues) et tri (plus récents ou délai restant).",
        ],
      },
      {
        titre: "Tableau",
        points: [
          "Colonnes : numéro ACR-AAAA-NNNN, objet et procédure, catégorie, province, statut, progression et anneau de délai.",
          "Une pastille signale les dossiers dont l’action vous revient (« Action attendue de votre part »).",
          "Clic sur une ligne : ouverture de la fiche du dossier.",
        ],
      },
      {
        titre: "Export et dépôt",
        points: [
          "Agents : bouton « Exporter » qui génère un CSV (séparateur ;, UTF-8) du registre filtré. L’export est lui-même journalisé (exigence de confidentialité).",
          "Demandeur : bouton « Nouvelle demande ».",
          "Le registre est cloisonné : un agent provincial ne voit que sa province ; le DG voit le registre national.",
        ],
      },
    ],
    exigences: ["F03 Numérotation unique, registre, suivi d’état", "F01 Rôles & habilitations par province"],
  },
  {
    id: "dossier",
    groupe: "Instruction",
    titre: "Fiche d’un dossier",
    route: "/dossiers/[numéro]",
    href: "/dossiers/ACR-2026-0042",
    icon: "file",
    acces: "tous",
    resume:
      "Cœur de l’instruction : toutes les informations du dossier, son circuit, ses pièces, son historique et le panneau d’actions qui fait avancer la procédure.",
    fonctionnalites: [
      {
        titre: "En-tête",
        points: [
          "Numéro, procédure (étiquette colorée selon le module), statut, objet et localisation.",
          "Stepper du circuit propre à la procédure : étapes franchies, étape courante et étapes à venir.",
          "Anneau de délai : jours ouvrables consommés sur le délai réglementaire, suspension visible pendant les compléments.",
          "Bandeau rouge si le titre a été retiré (date, motif, auteur).",
        ],
      },
      {
        titre: "Onglets",
        points: [
          "Aperçu : établissement ou titulaire, promoteur, pharmacien responsable, champs propres à la procédure (nom commercial, DCI, forme, dosage, produits importés, effet indésirable…), dossier de référence (avis, AMM d’origine), agent instructeur.",
          "Pièces : liste des pièces exigibles avec nom, version, taille, empreinte SHA-256, déposant et visibilité. Les nouvelles versions ne remplacent jamais les anciennes.",
          "Recevabilité : liste de contrôle (conforme / à corriger) et motif de l’instructeur.",
          "Paiement : montant indicatif, référence, invitation à payer, justificatif déposé, validation ou rejet par les finances.",
          "Évaluation (produits, AMM, vigilance…) : un rapport par critère (qualité, sécurité, efficacité, conformité réglementaire…) avec conclusion, auteur et date.",
          "Inspection : équipe et ordre de mission, grille, photos, position GPS, signature du PV, ou dispense motivée lorsque l’inspection n’est requise que « si nécessaire ».",
          "Décision : avis collégial (CPOP ou commission), issue (favorable, défavorable, octroi, retrait…), motivation, visas, signataire, numéro de titre, date de fin de validité.",
          "Traçabilité : extrait du journal d’audit chaîné propre au dossier.",
        ],
      },
      {
        titre: "Panneau d’actions",
        points: [
          "Affiche uniquement les actions que votre profil peut réaliser à l’étape courante ; sinon, il indique qui doit agir et propose « Passer au profil … » pour la démonstration.",
          "Secrétariat : orienter le dossier vers un agent instructeur.",
          "Bureau : déclarer recevable ou « Demander des compléments » (le délai est suspendu et la suspension tracée), émettre l’ordre de mission, accorder une dispense d’inspection motivée, rédiger le projet de décision en choisissant l’issue.",
          "Finances : émettre l’invitation à payer, valider ou « Rejeter le justificatif ».",
          "Expert : rédiger un rapport par critère puis clôturer l’évaluation (chaque critère doit avoir un rapport).",
          "CPOP / commission : rendre l’avis collégial motivé.",
          "Directeur provincial ou DG : signer après vérification automatique des prérequis (recevabilité, paiement, PV ou dispense, avis collégial), avec code OTP simulé. La signature attribue le numéro de titre et la date de validité, puis notifie le demandeur.",
          "Demandeur : déposer compléments et justificatifs, accuser réception de la décision.",
          "Secrétariat : archiver le dossier notifié.",
          "« Documents générés » : liens vers l’accusé de réception, l’invitation à payer, l’ordre de mission, le PV, le rapport d’évaluation et la décision.",
        ],
      },
    ],
    astuces: [
      "ACR-2026-0042 illustre le circuit complet d’un avis d’implantation ; ACR-2026-0081 celui d’une AMM (expert → commission → bureau → DG).",
    ],
    exigences: ["F04 Recevabilité, compléments, paiement", "F06 Avis CPOP, décision motivée, signature"],
  },
  {
    id: "nouvelle-demande",
    groupe: "Instruction",
    titre: "Nouvelle demande",
    route: "/nouvelle-demande",
    href: "/nouvelle-demande",
    icon: "plus",
    acces: ["demandeur"],
    resume:
      "Assistant de dépôt en quatre étapes. Le formulaire, les pièces exigibles et le circuit s’adaptent au module, à la procédure et à la catégorie choisis.",
    fonctionnalites: [
      {
        titre: "1. Procédure",
        points: [
          "Choix du module puis de la procédure (avis d’implantation, licence, enregistrement, AMM, variation, renouvellement, autorisation médicale, importation, vigilance…).",
          "Choix de la catégorie (officine, grossiste, hôpital, clinique, médicament, dispositif…) qui détermine la redevance et les pièces.",
          "Procédures dépendantes : sélection obligatoire du dossier de référence (avis favorable pour un PV de constat, AMM en vigueur pour une variation ou un renouvellement). Les données du produit sont reprises automatiquement.",
        ],
      },
      {
        titre: "2. Informations",
        points: [
          "Bloc établissement ou titulaire (dénomination, adresse, commune, province), promoteur (nom, téléphone, e-mail) et pharmacien responsable (n° d’Ordre CNOP).",
          "Champs propres à la procédure : nom commercial, DCI, forme, dosage, fabricant et pays pour un produit ; type de variation ; liste des produits pour l’importation ; produit suspect, gravité et description pour la vigilance ; type d’établissement médical…",
          "Validation en direct : impossible de passer à l’étape suivante si un champ obligatoire manque (« Étape incomplète »).",
        ],
      },
      {
        titre: "3. Pièces",
        points: [
          "Liste des pièces exigibles calculée selon procédure × catégorie (modules CTD, RCP, certificat BPF, plans, diplômes…).",
          "Glisser-déposer ou sélection de fichiers ; l’empreinte SHA-256 est calculée réellement dans le navigateur.",
          "Détection des doublons (même empreinte) et indicateur de complétude.",
        ],
      },
      {
        titre: "4. Soumission",
        points: [
          "Récapitulatif, montant indicatif de la redevance et délai réglementaire.",
          "Barre latérale « Circuit » : étapes, acteurs et signataire de la procédure choisie.",
          "« Enregistrer le brouillon » à tout moment (reprise possible depuis le tableau de bord) ou soumission : le dossier reçoit son numéro ACR-AAAA-NNNN, l’accusé de réception est généré et le secrétariat est notifié.",
        ],
      },
    ],
    exigences: ["F02 Formulaires adaptatifs, brouillons, complétude"],
  },
  {
    id: "inspections",
    groupe: "Contrôle",
    titre: "Inspections",
    route: "/inspections",
    href: "/inspections",
    icon: "radar",
    acces: ["bureau", "inspecteur", "directeur", "dg"],
    resume: "Planification et suivi des missions d’inspection : visites à organiser, visites programmées et PV signés.",
    fonctionnalites: [
      {
        titre: "Trois colonnes",
        points: [
          "À planifier : dossiers à l’étape inspection sans ordre de mission. Le bureau y émet l’ordre de mission ou, si la procédure le permet, la dispense.",
          "Programmées : missions avec date de visite et équipe d’inspection ; l’inspecteur ouvre l’interface terrain.",
          "PV signés récents : procès-verbaux finalisés avec conclusion et date.",
        ],
      },
      {
        titre: "Périmètre",
        points: [
          "L’inspecteur voit les missions qui lui sont attribuées ; le bureau et le directeur celles de leur province ; le DG toutes.",
        ],
      },
    ],
    exigences: ["F05 Visites, grille annexe 04, preuves, PV"],
  },
  {
    id: "inspection",
    groupe: "Contrôle",
    titre: "Interface terrain d’inspection",
    route: "/inspections/[numéro]",
    icon: "map",
    acces: ["inspecteur", "bureau", "directeur", "dg"],
    resume:
      "Écran pensé pour la tablette ou le téléphone de l’inspecteur pendant la visite : grille, preuves photo, géolocalisation et signature du PV.",
    fonctionnalites: [
      {
        titre: "Saisie de la visite",
        points: [
          "Grille d’inspection propre à la procédure (annexe 04 pour la pharmacie, grille médicale pour les établissements de santé) : chaque critère est noté conforme, avec réserves ou non conforme, avec observation.",
          "Observations générales.",
          "« Prendre / joindre des photos » : appareil photo du terminal ou fichiers, avec vignettes.",
          "« Capturer la position GPS » : géolocalisation du lieu de visite (position de secours si le navigateur la refuse).",
          "« Enregistrer » : sauvegarde du brouillon de PV sans perte.",
        ],
      },
      {
        titre: "Signature du PV",
        points: [
          "Pavé de signature manuscrite.",
          "« Signer et transmettre le PV » n’est actif que si la grille est complète, la position GPS capturée et la signature apposée.",
          "Un PV signé n’est jamais écrasé : toute correction crée une nouvelle version (v2, v3…).",
          "La transmission fait passer le dossier à l’étape suivante et notifie le CPOP ou la commission et le bureau.",
        ],
      },
    ],
  },
  {
    id: "registres",
    groupe: "Contrôle",
    titre: "Registres réglementaires",
    route: "/registres",
    href: "/registres",
    icon: "library",
    acces: "tous",
    resume:
      "Les « résultats / délivrables » du RIMS : tous les titres délivrés (avis, PV, licences, enregistrements, AMM, autorisations médicales, autorisations d’importation) avec leur cycle de vie.",
    fonctionnalites: [
      {
        titre: "Consultation",
        points: [
          "Cartes de module cliquables (avec le nombre de titres non retirés) pour filtrer le registre ; un second clic revient à « tous ».",
          "Badge de statut sur chaque titre : en vigueur, à renouveler, expiré, retiré.",
          "Recherche par n° de titre, produit, DCI ou titulaire.",
          "Chaque titre affiche son numéro (ex. AMM/2026/0081), l’objet, le titulaire, la date de délivrance et la fin de validité.",
          "« À renouveler » est calculé automatiquement selon la durée de validité du titre (20 % de la validité, au plus 180 jours avant l’échéance).",
          "Historique rattaché : variations (type IA, IB, II) et renouvellements apparaissent sous l’AMM d’origine ; un renouvellement prolonge sa validité.",
        ],
      },
      {
        titre: "Retrait d’un titre",
        points: [
          "Réservé au DG et au directeur de la province concernée.",
          "Boîte de dialogue avec motif obligatoire (défaut qualité, rapport de vigilance, fraude…).",
          "Le retrait est journalisé, affiché sur la fiche du dossier et signalé sur /verifier comme « titre retiré ».",
        ],
      },
    ],
    exigences: ["F10 AMM, enregistrement, autres autorisations"],
  },
  {
    id: "audit",
    groupe: "Contrôle",
    titre: "Journal d’audit",
    route: "/audit",
    href: "/audit",
    icon: "history",
    acces: ["bureau", "directeur", "dg"],
    resume:
      "Historique append-only de toutes les actions sensibles. Chaque événement est horodaté, attribué et chaîné cryptographiquement au précédent.",
    fonctionnalites: [
      {
        titre: "Consultation",
        points: [
          "Tableau chronologique : date, dossier, action, transition de statut, acteur et rôle, commentaire, empreinte de l’événement.",
          "Filtre texte par dossier, action, acteur ou commentaire.",
          "Périmètre : la province de l’agent ; tout le pays pour le DG.",
        ],
      },
      {
        titre: "Intégrité (profil DG)",
        points: [
          "« Vérifier toute la chaîne » : recalcule chaque empreinte SHA-256 et confirme que rien n’a été modifié (« Intégrité vérifiée »).",
          "« Simuler une altération » : modifie un ancien événement pour démontrer que la vérification détecte et localise la rupture (« Altération détectée »).",
        ],
      },
    ],
    exigences: ["F08 Tableaux de bord, délais, audit, recherche"],
  },
  {
    id: "referentiels",
    groupe: "Contrôle",
    titre: "Référentiels",
    route: "/referentiels",
    href: "/referentiels",
    icon: "book",
    acces: AGENTS,
    resume:
      "Paramétrage consultable du moteur de workflow et des listes réglementaires. C’est la référence à valider en atelier métier (§14 du cahier des charges).",
    fonctionnalites: [
      {
        titre: "Onglets",
        points: [
          "Modules & procédures : pour chaque procédure, étapes, pièces exigibles, liste de recevabilité, critères d’évaluation, avis collégial, signataire, issues de décision, délai, redevance et validité.",
          "Catégories : catégories d’établissements, de produits et d’établissements médicaux, avec leur redevance indicative.",
          "Habilitations : matrice rôles × actions (qui peut déposer, instruire, évaluer, inspecter, signer, retirer…).",
          "Grilles d’inspection : grille pharmaceutique (annexe 04) et grille des établissements médicaux.",
          "Textes : base légale et réglementaire.",
          "Annexes POS : modèles de documents de la procédure opérationnelle standard.",
          "Provinces : les 26 provinces et leurs codes.",
        ],
      },
    ],
    exigences: ["F09 Référentiels"],
  },
  {
    id: "documents",
    groupe: "Public",
    titre: "Documents imprimables",
    route: "/documents/[numéro]",
    icon: "printer",
    acces: "tous",
    resume:
      "Version officielle et imprimable de chaque document généré : accusé de réception, invitation à payer, ordre de mission, PV, rapport d’évaluation, avis, AMM, autorisation…",
    fonctionnalites: [
      {
        titre: "Contenu",
        points: [
          "En-tête officiel ACOREP, intitulé adapté à la procédure et à l’issue, objet, références et motivation.",
          "Mention « Signé électroniquement par », date, numéro de décision et date de fin de validité.",
          "QR code et code de vérification à 12 caractères renvoyant vers /verifier.",
          "Extrait du journal d’audit chaîné et empreinte du document.",
          "Filigrane « DÉMONSTRATION · FICTIF ».",
        ],
      },
      {
        titre: "Actions",
        points: ["Impression ou enregistrement en PDF depuis le navigateur (mise en page A4 dédiée)."],
      },
    ],
    exigences: ["F07 Notifications, accusés, PDF vérifiable"],
  },
  {
    id: "verifier",
    groupe: "Public",
    titre: "Vérifier un document",
    route: "/verifier",
    href: "/verifier",
    icon: "qr",
    acces: "public",
    resume:
      "Service public qui permet à quiconque (pharmacien, douane, patient, partenaire) de contrôler l’authenticité d’un document émis par l’ACOREP.",
    fonctionnalites: [
      {
        titre: "Vérification",
        points: [
          "Saisie du code à 12 caractères imprimé sur le document, ou ouverture directe via le QR code.",
          "Résultat authentique : type de document, numéro, titulaire, objet, issue, signataire, date de signature et validité.",
          "Alerte si le titre est expiré ou retiré (avec motif) : un document authentique peut ne plus être valable.",
          "Code inconnu : message explicite de non-authenticité.",
        ],
      },
    ],
  },
]

export const DOC_SHELL: DocFeature[] = [
  {
    titre: "Barre supérieure",
    points: [
      "Recherche globale (Ctrl K ou ⌘ K) : dossiers par numéro, objet, produit, DCI ou établissement, et accès rapide à toutes les pages.",
      "Indicateur de province du profil courant (« National » pour le DG).",
      "↺ Réinitialiser la démonstration : restaure les données d’origine.",
      "Bascule thème clair / sombre.",
      "Cloche de notifications : messages adressés à votre profil (dossier à traiter, décision notifiée…), avec lien vers le dossier.",
      "Menu profil : changer d’acteur à tout moment parmi tous les profils de démonstration, ou revenir à l’accueil.",
    ],
  },
  {
    titre: "Menu latéral",
    points: [
      "Groupes Pilotage, Contrôle, Public et Aide ; chaque entrée n’apparaît que si votre rôle y a accès.",
      "Compteur de la file de travail en temps réel.",
      "Sur mobile, le menu s’ouvre via le bouton ☰.",
    ],
  },
  {
    titre: "Données de démonstration",
    points: [
      "Aucune base de données : l’état est conservé dans le navigateur (localStorage). Chaque navigateur a sa propre démonstration.",
      "Toutes les données sont fictives. Délais (hors POS), redevances et listes de pièces sont indicatifs.",
    ],
  },
]

export const DOC_FAQ: { q: string; r: string }[] = [
  {
    q: "Pourquoi un dossier n’apparaît-il pas dans ma file de travail ?",
    r: "La file ne montre que les dossiers dont l’étape courante relève de votre rôle et de votre province. Ouvrez le dossier : le panneau d’actions indique qui doit agir.",
  },
  {
    q: "Comment faire avancer un dossier seul pendant une démonstration ?",
    r: "Sur la fiche du dossier, le bouton « Passer au profil … » bascule sur l’acteur attendu. Vous pouvez aussi utiliser le menu profil ou le paramètre ?as= dans l’URL.",
  },
  {
    q: "Comment le délai est-il calculé ?",
    r: "En jours ouvrables (hors week-ends) depuis la réception, selon le délai de la procédure. Il est suspendu pendant l’attente de compléments du demandeur ; chaque suspension est tracée.",
  },
  {
    q: "Quand l’inspection peut-elle être dispensée ?",
    r: "Uniquement pour les procédures où elle est « si nécessaire » (établissements médicaux). Le bureau doit saisir un motif ; la dispense apparaît dans l’onglet Inspection et au journal.",
  },
  {
    q: "Qui signe les décisions ?",
    r: "Le directeur provincial pour les procédures provinciales (établissements pharmaceutiques et médicaux) ; le DG pour les procédures nationales (enregistrement, AMM, importation, vigilance).",
  },
  {
    q: "Une décision défavorable crée-t-elle un titre ?",
    r: "Non. Seules les décisions positives signées alimentent les registres. Le document de décision reste généré et vérifiable.",
  },
  {
    q: "Comment remettre la démonstration à zéro ?",
    r: "Bouton ↺ dans la barre supérieure. Les données d’origine sont restaurées dans ce navigateur.",
  },
]
