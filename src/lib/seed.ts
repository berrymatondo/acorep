import type { AuditEvent, CategoryId, Dossier, ProcedureType, Role, Status } from "./types"
import { GENESIS, eventHash, sha256 } from "./sha256"
import { agentFor } from "./workflow"
import { categoriesFor, checklistFor, feeFor, grilleFor, procDef, requiredPieces } from "./procedures"

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let rnd = mulberry32(20261115)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]

const COMMUNES_KIN = ["Gombe", "Lingwala", "Kintambo", "Ngaliema", "Limete", "Bandalungwa", "Kalamu", "Matete", "Lemba", "Masina", "Ndjili", "Kasa-Vubu", "Barumbu", "Mont-Ngafula", "Selembao"]
const VILLES: Record<string, string[]> = {
  "Haut-Katanga": ["Lubumbashi", "Likasi", "Kipushi"],
  Lualaba: ["Kolwezi", "Fungurume"],
  "Nord-Kivu": ["Goma", "Butembo", "Beni"],
  "Sud-Kivu": ["Bukavu", "Uvira"],
  Tshopo: ["Kisangani"],
  "Kongo-Central": ["Matadi", "Boma", "Mbanza-Ngungu"],
  "Kasaï-Central": ["Kananga"],
  Ituri: ["Bunia"],
  Équateur: ["Mbandaka"],
}
const NOMS = ["Bethesda", "La Grâce", "Elikia", "Bondeko", "du Fleuve", "Saint-Luc", "Esengo", "Lisanga", "Shalom", "Le Bon Samaritain", "Tujenge", "Amani", "Nouvelle Vie", "Mwinda", "Kimia", "Horizon", "Espérance", "Sainte-Famille", "Bomoko", "Victoire", "Mapendo", "Étoile", "Jubilé", "Lumière"]
const PREFIX: Record<string, string> = {
  officine: "Pharmacie", depot: "Dépôt pharmaceutique", grossiste: "Répartiteur", fabrication: "Laboratoires", importateur: "Import-Pharma", hospitaliere: "Pharmacie hospitalière",
  hopital: "Hôpital", clinique: "Clinique", centre_sante: "Centre de santé", laboratoire: "Laboratoire d’analyses", imagerie: "Centre d’imagerie",
}
const TITULAIRES = ["Lisanga Labs SARL", "Mwinda Santé Industries", "Equator Pharmaceuticals SA", "Tujenge Pharma", "Afrimed Distribution", "Kimia Biotech", "Bondeko Generics"]
const PRODUITS = [
  { nomCommercial: "Febrinol", dci: "Paracétamol", forme: "Comprimé", dosage: "500 mg", classe: "Antalgique / antipyrétique" },
  { nomCommercial: "Amoxicare", dci: "Amoxicilline", forme: "Gélule", dosage: "500 mg", classe: "Antibiotique" },
  { nomCommercial: "Malacure", dci: "Artéméther + luméfantrine", forme: "Comprimé", dosage: "20/120 mg", classe: "Antipaludique" },
  { nomCommercial: "Artesix", dci: "Artésunate", forme: "Poudre pour injection", dosage: "60 mg", classe: "Antipaludique" },
  { nomCommercial: "Zincora", dci: "Sulfate de zinc", forme: "Comprimé", dosage: "20 mg", classe: "Oligo-élément" },
  { nomCommercial: "Glucoval", dci: "Metformine", forme: "Comprimé", dosage: "850 mg", classe: "Antidiabétique" },
  { nomCommercial: "Hydrosel", dci: "Sels de réhydratation orale", forme: "Suspension buvable", dosage: "20,5 g/L", classe: "Réhydratation" },
  { nomCommercial: "Cotrimex", dci: "Cotrimoxazole", forme: "Comprimé", dosage: "960 mg", classe: "Antibiotique" },
  { nomCommercial: "Tensiopril", dci: "Énalapril", forme: "Comprimé", dosage: "10 mg", classe: "Antihypertenseur" },
  { nomCommercial: "Ferrovit", dci: "Fumarate ferreux + acide folique", forme: "Comprimé", dosage: "200/0,4 mg", classe: "Antianémique" },
  { nomCommercial: "Vaxiprot", dci: "Vaccin antitétanique adsorbé", forme: "Solution injectable", dosage: "0,5 mL", classe: "Vaccin" },
  { nomCommercial: "Oxytal", dci: "Oxytocine", forme: "Solution injectable", dosage: "10 UI/mL", classe: "Utérotonique" },
]
const PERSONNES = ["Jean-Pierre Lukusa", "Béatrice Kanku", "Christian Mwamba", "Nadine Ngalula", "Olivier Kabongo", "Sylvie Mputu", "Héritier Banza", "Clarisse Mujinga", "Fiston Ngoy", "Rachel Kapinga", "Trésor Ekofo", "Divine Mbombo", "Gloire Nzuzi", "Merveille Lumbu"]

const DAY = 86400000
const NOW = Date.now()
const at = (daysAgo: number) => {
  const d = new Date(NOW - daysAgo * DAY)
  d.setHours(8 + Math.floor(rnd() * 9), Math.floor(rnd() * 60), 0, 0)
  if (d.getTime() > NOW) d.setTime(NOW - 3600000)
  return d.toISOString()
}

interface RawEvent {
  dossierId: string
  at: string
  actorId: string
  role: Role
  action: string
  comment?: string
  from?: Status
  to?: Status
}

interface Spec {
  n: number
  type?: ProcedureType
  target: Status
  province?: string
  cat?: CategoryId
  owner?: string
  start: number
  /** Jours écoulés depuis le dernier événement (0 = aujourd’hui). */
  end?: number
  complements?: boolean | "open"
  issue?: string
  sub?: number
  parentId?: string
  nom?: string
  commune?: string
  produit?: number
  details?: Record<string, string>
  dispense?: boolean
}

type Step = {
  status: Status
  role: Role
  action: string
  comment?: string
  apply: (d: Dossier, t: string, actor: (r: Role) => string) => void
}

/** Construit la suite d’événements d’un dossier à partir de la définition de sa procédure. */
function buildSteps(spec: Spec, type: ProcedureType): Step[] {
  const def = procDef(type)
  const negative = def.outcomes.find((o) => !o.positive)!.id
  const issue = spec.issue ?? def.outcomes[0].id
  const isNeg = issue === negative
  const steps: Step[] = []
  def.stages.forEach((stage, i) => {
    const next = def.stages[i + 1]
    switch (stage) {
      case "depose":
        steps.push(
          { status: "depose", role: "demandeur", action: "Dépôt en ligne — accusé de réception généré", apply: (d, t) => { d.submittedAt = t; d.receivedAt = t; d.accuseRef = `AR-${d.id.slice(4)}` } },
          { status: next, role: "secretariat", action: "Dossier enregistré au registre et orienté", apply: (d, _t, a) => { d.assigneeId = a("bureau") } }
        )
        break
      case "recevabilite":
        if (spec.complements) {
          const motif = def.categoryGroup === "produit" ? "Module 3 incomplet : données de stabilité manquantes." : "Plan des locaux non coté ; justificatif d’occupation expiré."
          steps.push({
            status: "complements", role: "bureau", action: "Demande de compléments — délai suspendu", comment: motif,
            apply: (d, t) => {
              const ids = checklistFor(type).slice(1, 3).map((c) => c.id)
              ids.forEach((id) => (d.checklist[id] = "ko"))
              d.complementsDemandes = motif
              d.suspensions.push({ debut: t, motif: "Compléments demandés" })
            },
          })
          if (spec.complements !== "open")
            steps.push({
              status: "recevabilite", role: "demandeur", action: "Compléments transmis — reprise du délai",
              apply: (d, t) => {
                d.suspensions[d.suspensions.length - 1].fin = t
                Object.keys(d.checklist).forEach((k) => d.checklist[k] === "ko" && (d.checklist[k] = null))
              },
            })
        }
        steps.push({ status: next, role: "bureau", action: "Recevabilité validée", apply: (d) => { checklistFor(type).forEach((c) => (d.checklist[c.id] = "ok")) } })
        break
      case "paiement":
        steps.push(
          { status: "paiement", role: "finance", action: "Invitation à payer émise", apply: (d, t) => { d.paiement = { ...d.paiement!, inviteLe: t } } },
          { status: "paiement", role: "demandeur", action: "Justificatif de paiement déposé", apply: (d) => { d.paiement = { ...d.paiement!, preuve: `Bordereau ${d.paiement!.reference}.pdf` } } },
          { status: next, role: "finance", action: "Paiement vérifié et validé", apply: (d, t) => { d.paiement = { ...d.paiement!, valideLe: t } } }
        )
        break
      case "evaluation": {
        const ev = def.evaluation!
        ev.axes.forEach((ax, k) => {
          steps.push({
            status: "evaluation", role: ev.role, action: `Rapport d’évaluation — ${ax.label}`,
            apply: (d, t, a) => {
              const conclusion = isNeg && k === 0 ? "defavorable" : rnd() > 0.75 ? "reserves" : "favorable"
              d.evaluation = d.evaluation ?? { axes: {} }
              d.evaluation.axes[ax.id] = {
                conclusion, le: t,
                par: ev.role === "expert" ? (k % 2 ? "u-exp2" : "u-exp") : a(ev.role),
                rapport: conclusion === "defavorable" ? "Non-conformités majeures relevées, données insuffisantes." : conclusion === "reserves" ? "Conforme sous réserve d’engagements post-autorisation." : "Données conformes aux exigences.",
              }
            },
          })
        })
        steps.push({ status: next, role: ev.role, action: "Évaluation clôturée", apply: (d, t) => { d.evaluation = { ...d.evaluation!, clotureLe: t } } })
        break
      }
      case "inspection":
        if (spec.dispense && def.inspectionOptionnelle) {
          steps.push({ status: next, role: "bureau", action: "Inspection non requise — dispense motivée", comment: "Exigences vérifiées sur pièces, établissement déjà inspecté.", apply: (d, t, a) => { d.inspectionDispensee = { motif: "Exigences vérifiées sur pièces, établissement déjà inspecté.", le: t, par: a("bureau") } } })
          break
        }
        steps.push(
          { status: "inspection", role: "bureau", action: "Ordre de mission émis", apply: (d, t) => { d.mission = { ordre: `OM-${d.id.slice(4)}`, date: new Date(new Date(t).getTime() + 3 * DAY).toISOString(), inspecteurs: ["u-ins", "u-ins2"] } } },
          {
            status: next, role: "inspecteur", action: "Visite réalisée — PV signé",
            apply: (d, t) => {
              const grille: Record<string, { v: "conforme" | "a_corriger" | "non_conforme"; obs: string }> = {}
              grilleFor(type).forEach((g, k) => {
                grille[g.id] = { v: isNeg && k === 2 ? "non_conforme" : rnd() > 0.82 ? "a_corriger" : "conforme", obs: g.id === "hygiene" ? "Ventilation à améliorer" : "" }
              })
              d.inspection = {
                grille, observations: isNeg ? "Non-conformité majeure constatée." : "Réserves mineures levées sur place.",
                photos: 3 + Math.floor(rnd() * 6), gps: { lat: -4.32 - rnd() * 0.1, lng: 15.28 + rnd() * 0.1 }, signeLe: t, pvVersion: 1,
              }
            },
          }
        )
        break
      case "cpop": {
        const avis = isNeg ? "defavorable" : "favorable"
        steps.push({
          status: next, role: def.commission!.role, action: `${def.commission!.label} : ${avis}`,
          apply: (d, t, a) => { d.cpop = { avis, motif: avis === "favorable" ? "Conformité aux exigences réglementaires." : "Exigences réglementaires non satisfaites.", le: t, par: a(def.commission!.role) } },
        })
        break
      }
      case "projet":
        steps.push({
          status: next, role: "bureau", action: "Projet de décision rédigé et visé",
          apply: (d, t, a) => {
            d.decision = {
              issue,
              motivation: isNeg ? "Les exigences réglementaires ne sont pas satisfaites au vu de l’instruction et des avis recueillis." : "Le dossier est recevable, l’instruction est concluante et les avis recueillis sont favorables.",
              projetLe: t, visas: [{ role: "bureau", par: a("bureau"), le: t }],
            }
          },
        })
        break
      case "signature":
        steps.push({
          status: next, role: def.signataire, action: "Décision signée et notifiée",
          apply: (d, t, a) => {
            const fin = def.validiteMois && !isNeg ? new Date(new Date(t).getTime() + def.validiteMois * 30.44 * DAY).toISOString() : undefined
            d.decision = {
              ...d.decision!, signeLe: t, signePar: a(def.signataire), codeVerif: sha256(d.id + t).slice(0, 12).toUpperCase(),
              numero: `${def.numeroPrefix}/${new Date(t).getFullYear()}/${d.id.slice(9)}`, validiteFin: fin,
              visas: [...d.decision!.visas, { role: def.signataire, par: a(def.signataire), le: t }],
            }
            d.notification = { envoyeLe: t, canal: "Portail + courriel" }
          },
        })
        break
      case "notifie":
        steps.push(
          { status: "notifie", role: "demandeur", action: "Accusé de réception de la notification", apply: (d, t) => { d.notification = { ...d.notification!, recuLe: t } } },
          { status: "archive", role: "secretariat", action: "Dossier classé et archivé", apply: () => {} }
        )
        break
    }
  })
  return steps
}

function makeDossier(spec: Spec, events: RawEvent[]): Dossier {
  const type = spec.type ?? "avis_implantation"
  const def = procDef(type)
  const province = spec.province ?? "Kinshasa"
  const cats = categoriesFor(type)
  const cat = spec.cat ?? (def.categoryGroup === "pharma" ? (rnd() > 0.35 ? "officine" : pick(cats).id) : pick(cats).id)
  const id = `ACR-2026-${String(spec.n).padStart(4, "0")}`
  const produit = def.categoryGroup === "produit" ? PRODUITS[(spec.produit ?? Math.floor(rnd() * PRODUITS.length)) % PRODUITS.length] : undefined
  const isTitulaire = def.subject.bloc !== "Établissement" && def.subject.bloc !== "Établissement médical" && def.subject.bloc !== "Notificateur"
  const nom =
    spec.nom ??
    (isTitulaire ? pick(TITULAIRES) : def.module === "autres" && type === "vigilance" ? `${pick(["Hôpital", "Centre de santé", "Clinique"])} ${pick(NOMS)}` : `${PREFIX[cat] ?? "Établissement"} ${pick(NOMS)}`)
  const commune = spec.commune ?? (province === "Kinshasa" ? pick(COMMUNES_KIN) : pick(VILLES[province] ?? ["Chef-lieu"]))
  const promoteur = pick(PERSONNES)
  const ownerId = spec.owner ?? `dem-${spec.n}`
  const created = at(spec.start + 1)
  const details: Record<string, string> = { ...(spec.details ?? {}) }
  if (produit && type !== "vigilance" && type !== "import_export") Object.assign(details, { ...produit, fabricant: `${nom.split(" ")[0]} — Kinshasa`, pays: "RD Congo" }, spec.details ?? {})
  if (type === "vigilance" && produit) Object.assign(details, { produitSuspect: `${produit.nomCommercial} (${produit.dci})`, lot: `L${Math.floor(10000 + rnd() * 89999)}`, effet: "Éruption cutanée généralisée apparue 48 h après la première prise.", gravite: pick(["Non grave", "Grave — hospitalisation"]), dateSurvenue: created.slice(0, 10) }, spec.details ?? {})
  if (type === "import_export" && produit) Object.assign(details, { sens: "Importation", produits: `${produit.nomCommercial} ${produit.dosage} — 120 000 unités`, paysProvenance: pick(["Inde", "Belgique", "Kenya", "Chine"]), pointEntree: "Port de Matadi" }, spec.details ?? {})
  if (type === "autorisation_medicale") Object.assign(details, { capacite: `${10 + Math.floor(rnd() * 90)} lits`, services: "Médecine interne, pédiatrie, maternité, laboratoire" }, spec.details ?? {})
  if (type === "licence") Object.assign(details, { typeLicence: "Licence d’exploitation d’officine" }, spec.details ?? {})

  const d: Dossier = {
    id, type, province, categorie: cat, parentId: spec.parentId,
    status: "brouillon",
    etablissement: { nom, adresse: `${10 + Math.floor(rnd() * 240)}, avenue ${pick(["de la Libération", "du Commerce", "Kasa-Vubu", "des Huileries", "Lumumba", "du 30 Juin", "Kabambare"])}`, commune },
    promoteur: { nom: promoteur, telephone: `+243 8${Math.floor(rnd() * 10)} ${Math.floor(100 + rnd() * 899)} ${Math.floor(1000 + rnd() * 8999)}`, email: `${promoteur.split(" ")[0].toLowerCase()}@exemple.cd` },
    pharmacien: { nom: spec.owner === "u-dem" ? "Ph. Grâce Mbuyi" : spec.owner === "u-lab" ? "Dr Patrice Mukuna" : `${def.module === "medicaux" ? "Dr" : "Ph."} ${pick(PERSONNES)}`, numeroOrdre: `${def.module === "medicaux" ? "CNOM" : "CNOP"}/${Math.floor(1000 + rnd() * 8999)}` },
    details: Object.keys(details).length ? details : undefined,
    ownerId, createdAt: created,
    pieces: requiredPieces(type, cat).map((p, i) => ({
      id: `${id}-p${i}`, typeId: p.id, nom: `${p.id}_${id.slice(9)}.pdf`, taille: Math.floor(80_000 + rnd() * 2_400_000),
      hash: sha256(`${id}-${p.id}`), version: 1, deposePar: ownerId, deposeLe: created, visibilite: "demandeur" as const,
    })),
    checklist: Object.fromEntries(checklistFor(type).map((c) => [c.id, null])),
    paiement: def.stages.includes("paiement") ? { montant: feeFor(type, cat), reference: `IP-${id.slice(4)}` } : undefined,
    suspensions: [],
  }
  const agent = agentFor(province)
  const actor = (r: Role) => {
    if (r === "demandeur") return ownerId
    if (province !== "Kinshasa") return r === "directeur" && province === "Haut-Katanga" ? "u-dir-hk" : r === "dg" ? "u-dg" : agent
    return { demandeur: ownerId, secretariat: "u-sec", bureau: "u-bur", expert: "u-exp", inspecteur: "u-ins", finance: "u-fin", cpop: "u-cpo", commission: "u-com", directeur: "u-dir", dg: "u-dg" }[r]
  }
  events.push({ dossierId: id, at: created, actorId: ownerId, role: "demandeur", action: "Brouillon créé", to: "brouillon" })
  if (spec.target === "brouillon") return d

  const steps = buildSteps(spec, type)
  const idxs = steps.map((s, i) => (s.status === spec.target ? i : -1)).filter((i) => i >= 0)
  const end = idxs.length ? idxs[Math.min(spec.sub ?? 0, idxs.length - 1)] : steps.length - 1
  const chosen = steps.slice(0, end + 1)
  const span = spec.start - (spec.end ?? 0)
  chosen.forEach((s, i) => {
    const daysAgo = Math.max(0.05, spec.start - (span * (i + 0.2 + rnd() * 0.5)) / chosen.length)
    const t = at(daysAgo)
    const from = d.status
    s.apply(d, t, actor)
    d.status = s.status
    events.push({ dossierId: id, at: t, actorId: actor(s.role), role: s.role, action: s.action, comment: s.comment, from, to: s.status !== from ? s.status : undefined })
  })
  return d
}

const SPECS: Spec[] = [
  // ── Établissements pharmaceutiques : dossiers de la démonstratrice (Ph. Grâce Mbuyi) ──
  { n: 40, target: "archive", owner: "u-dem", start: 74, cat: "officine", nom: "Pharmacie Bethesda", commune: "Lemba" },
  { n: 41, type: "pv_constat", target: "inspection", sub: 1, owner: "u-dem", start: 14, cat: "officine", nom: "Pharmacie Bethesda", commune: "Lemba", parentId: "ACR-2026-0040" },
  { n: 42, target: "recevabilite", owner: "u-dem", start: 4, cat: "officine", nom: "Pharmacie Bethesda — Annexe Ngaba", commune: "Ngaba" },
  { n: 57, target: "complements", owner: "u-dem", start: 9, complements: "open", cat: "depot", nom: "Dépôt pharmaceutique Elikia", commune: "Mont-Ngafula" },
  { n: 61, target: "paiement", sub: 1, owner: "u-dem", start: 7, cat: "officine", nom: "Pharmacie Bethesda Kintambo", commune: "Kintambo" },
  { n: 62, target: "brouillon", owner: "u-dem", start: 1, cat: "officine", nom: "Pharmacie Bethesda Gombe", commune: "Gombe" },
  // ── Établissements pharmaceutiques : Kinshasa ──
  { n: 22, target: "archive", start: 88 }, { n: 25, target: "archive", start: 80, issue: "defavorable" },
  { n: 27, target: "notifie", start: 66 }, { n: 29, target: "notifie", sub: 1, start: 58 },
  { n: 31, target: "signature", start: 52 }, { n: 33, target: "signature", start: 47, cat: "grossiste" },
  { n: 34, target: "projet", start: 44, issue: "defavorable" }, { n: 35, target: "projet", start: 38 },
  { n: 36, target: "cpop", start: 41, cat: "importateur" }, { n: 37, target: "cpop", start: 36 },
  { n: 38, target: "inspection", sub: 1, start: 30 }, { n: 39, target: "inspection", sub: 1, start: 27, cat: "fabrication" },
  { n: 43, target: "inspection", start: 25 }, { n: 44, target: "inspection", start: 22, complements: true },
  { n: 45, target: "paiement", start: 19 }, { n: 46, target: "paiement", sub: 2, start: 18 },
  { n: 47, target: "paiement", sub: 1, start: 16 }, { n: 48, target: "recevabilite", start: 12, complements: true },
  { n: 49, target: "recevabilite", start: 6 }, { n: 50, target: "recevabilite", start: 5, cat: "hospitaliere" },
  { n: 51, target: "complements", start: 15, complements: "open" }, { n: 52, target: "depose", start: 2 },
  { n: 53, target: "depose", start: 1 }, { n: 54, target: "depose", start: 0.6 },
  { n: 26, type: "pv_constat", target: "archive", start: 60, parentId: "ACR-2026-0022" },
  { n: 30, type: "pv_constat", target: "signature", start: 30 },
  { n: 32, target: "cpop", start: 57, complements: true },
  { n: 28, target: "inspection", sub: 1, start: 55 },
  { n: 63, type: "licence", target: "archive", start: 45, parentId: "ACR-2026-0022" },
  { n: 64, type: "licence", target: "inspection", sub: 1, start: 12 },
  // ── Enregistrement des produits ──
  { n: 70, type: "enregistrement_produit", target: "archive", start: 85, owner: "u-lab", nom: "Lisanga Labs SARL", produit: 0, cat: "generique" },
  { n: 71, type: "enregistrement_produit", target: "evaluation", sub: 2, start: 26, owner: "u-lab", nom: "Lisanga Labs SARL", produit: 4, cat: "generique" },
  { n: 72, type: "enregistrement_produit", target: "cpop", start: 40, produit: 9, cat: "generique" },
  { n: 73, type: "enregistrement_produit", target: "recevabilite", start: 6, produit: 11, cat: "traditionnel", complements: true },
  { n: 74, type: "enregistrement_produit", target: "signature", start: 50, produit: 6, cat: "generique" },
  { n: 75, type: "enregistrement_produit", target: "archive", start: 70, produit: 7, issue: "defavorable", cat: "generique" },
  // ── AMM ──
  { n: 80, type: "amm_nouveau", target: "archive", start: 82, owner: "u-lab", nom: "Lisanga Labs SARL", produit: 2, cat: "generique" },
  { n: 81, type: "amm_nouveau", target: "evaluation", sub: 1, start: 30, produit: 3, cat: "innovant" },
  { n: 82, type: "amm_nouveau", target: "cpop", start: 46, produit: 10, cat: "biologique" },
  { n: 83, type: "amm_nouveau", target: "paiement", sub: 1, start: 9, owner: "u-lab", nom: "Lisanga Labs SARL", produit: 5, cat: "generique" },
  { n: 84, type: "amm_nouveau", target: "archive", start: 78, produit: 8, cat: "generique" },
  { n: 85, type: "amm_variation", target: "evaluation", start: 15, owner: "u-lab", nom: "Lisanga Labs SARL", produit: 2, cat: "generique", parentId: "ACR-2026-0080", details: { typeVariation: "Mineure — type IB", objetVariation: "Ajout d’un second site de conditionnement à Lubumbashi." } },
  { n: 86, type: "amm_variation", target: "archive", start: 40, produit: 8, cat: "generique", parentId: "ACR-2026-0084", details: { typeVariation: "Majeure — type II", objetVariation: "Modification de la durée de conservation (24 → 36 mois)." } },
  { n: 87, type: "amm_renouvellement", target: "projet", start: 34, produit: 1, cat: "generique", parentId: "ACR-2026-0090", details: { modifications: "Aucune modification depuis l’octroi." } },
  { n: 88, type: "amm_nouveau", target: "signature", start: 55, produit: 11, cat: "generique" },
  { n: 90, type: "amm_nouveau", target: "archive", start: 1790, end: 1650, produit: 1, cat: "generique" },
  // ── Établissements médicaux ──
  { n: 91, type: "autorisation_medicale", target: "archive", start: 72, cat: "clinique", nom: "Clinique Bonne Santé" },
  { n: 92, type: "autorisation_medicale", target: "evaluation", sub: 2, start: 18, cat: "centre_sante" },
  { n: 93, type: "autorisation_medicale", target: "inspection", sub: 1, start: 28, cat: "hopital" },
  { n: 94, type: "autorisation_medicale", target: "signature", start: 44, cat: "laboratoire", dispense: true },
  { n: 95, type: "autorisation_medicale", target: "depose", start: 1.5, cat: "imagerie" },
  { n: 96, type: "autorisation_medicale", target: "archive", start: 60, cat: "clinique", province: "Haut-Katanga" },
  // ── Autres procédures ──
  { n: 100, type: "import_export", target: "archive", start: 50, produit: 2, cat: "generique", nom: "Afrimed Distribution" },
  { n: 101, type: "import_export", target: "evaluation", sub: 1, start: 8, produit: 6, cat: "generique", nom: "Afrimed Distribution" },
  { n: 102, type: "import_export", target: "signature", start: 20, produit: 10, cat: "biologique", nom: "Equator Pharmaceuticals SA" },
  { n: 103, type: "vigilance", target: "evaluation", sub: 1, start: 7, produit: 1, cat: "generique" },
  { n: 104, type: "vigilance", target: "archive", start: 40, produit: 2, cat: "generique", issue: "mesures" },
  { n: 105, type: "vigilance", target: "depose", start: 0.8, produit: 3, cat: "innovant" },
  // ── Autres provinces (visibles par la DG uniquement) ──
  { n: 3, target: "archive", province: "Haut-Katanga", start: 90 }, { n: 8, target: "signature", province: "Haut-Katanga", start: 40 },
  { n: 9, target: "inspection", sub: 1, province: "Haut-Katanga", start: 33, cat: "grossiste" }, { n: 11, target: "recevabilite", province: "Haut-Katanga", start: 8 },
  { n: 5, target: "notifie", province: "Lualaba", start: 62, cat: "importateur" }, { n: 12, target: "paiement", province: "Lualaba", start: 20 },
  { n: 6, target: "cpop", province: "Nord-Kivu", start: 64 }, { n: 13, target: "complements", province: "Nord-Kivu", start: 21, complements: "open" },
  { n: 7, target: "archive", province: "Sud-Kivu", start: 84, issue: "defavorable" }, { n: 14, target: "inspection", province: "Sud-Kivu", start: 24 },
  { n: 15, target: "projet", province: "Kongo-Central", start: 45 }, { n: 16, target: "depose", province: "Kongo-Central", start: 1 },
  { n: 17, target: "recevabilite", province: "Tshopo", start: 10 }, { n: 18, target: "notifie", province: "Kasaï-Central", start: 70 },
  { n: 19, target: "paiement", province: "Ituri", start: 17 }, { n: 20, target: "inspection", sub: 1, province: "Équateur", start: 29, cat: "depot" },
]

export function createSeed() {
  rnd = mulberry32(20261115)
  const raw: RawEvent[] = []
  const dossiers = SPECS.map((s) => makeDossier(s, raw))
  // AMM retirée par l’autorité (démonstration du retrait)
  const retire = dossiers.find((d) => d.id === "ACR-2026-0084")!
  const retraitLe = at(6)
  retire.decision = { ...retire.decision!, retrait: { le: retraitLe, motif: "Défaut qualité confirmé sur plusieurs lots (rapport de vigilance ACR-2026-0104).", par: "u-dg" } }
  raw.push({ dossierId: retire.id, at: retraitLe, actorId: "u-dg", role: "dg", action: "Retrait de l’AMM prononcé", comment: retire.decision.retrait!.motif })

  dossiers.sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt))
  raw.sort((a, b) => a.at.localeCompare(b.at))
  let prev = GENESIS
  const events: AuditEvent[] = raw.map((e, i) => {
    const ev = { ...e, id: `ev-${i}`, prevHash: prev }
    const hash = eventHash(ev)
    prev = hash
    return { ...ev, hash }
  })
  return { dossiers, events, counter: 105 }
}
