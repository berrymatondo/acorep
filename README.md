# ACOREP · RIMS

Prototype interactif du **Regulatory Information Management System** de l’Autorité Congolaise de Réglementation Pharmaceutique, conforme au cahier des charges ACOREP-RIMS v1.0.

## Modules et procédures

Un **moteur de workflow configurable** (`src/lib/procedures.ts`) assemble pour chaque procédure ses étapes, pièces, contrôles de recevabilité, critères d’évaluation, avis collégial, signataire, issues de décision, durée de validité et prérequis.

| Module | Procédures | Particularités |
|---|---|---|
| Établissements pharmaceutiques | Avis d’implantation, PV de constat, licence d’exploitation | POS AQ-POS-ENR-001-26, CPOP, PV ≤ 90 j après avis |
| Enregistrement des produits | Enregistrement d’un produit | Dossier CTD (qualité, sécurité, efficacité), évaluation par les experts, commission, signature DG |
| AMM | Nouveau produit, variation, renouvellement | Évaluation scientifique et réglementaire, octroi / modification / renouvellement, **retrait** depuis les registres |
| Établissements médicaux | Autorisation d’ouverture (hôpital, clinique, centre de santé, laboratoire, imagerie) | Vérification des exigences (infrastructure, personnel, équipements), **inspection si nécessaire** (dispense motivée) |
| Autres procédures | Importation / exportation, vigilance | Visa 6 mois ; vigilance sans redevance (imputabilité, gravité, signal, mesures) |

Les titres délivrés alimentent les **Registres** (`/registres`) : statut en vigueur / à renouveler / expiré / retiré, variations et renouvellements rattachés à l’AMM d’origine. Les délais d’instruction (hors POS) sont indicatifs.

> Données entièrement fictives. **Aucune base de données** : l’état est conservé dans le navigateur (Zustand + `localStorage`). Le bouton ↺ de la barre supérieure réinitialise la démo.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Stack

Next.js 16 (App Router, Turbopack, Cache Components) · React 19 · Tailwind CSS 4 · shadcn/ui (Radix, preset Nova) · Motion · Recharts · Zustand · date-fns · qrcode.react

## Parcours de démonstration

1. Page d’accueil → **Entrez avec un profil** (demandeurs, secrétariat, bureau, expert, inspecteur, finances, CPOP, commission, directeur, DG). Lien direct possible : `/dossiers/ACR-2026-0081?as=u-exp`.
2. Le menu profil (en haut à droite) permet de changer d’acteur à tout moment ; sur un dossier en attente d’un autre rôle, le bouton « Passer au profil … » fait avancer le circuit.
3. Exemple : `ACR-2026-0042` (Bureau → recevabilité) → Finances → Demandeur (justificatif) → Bureau (ordre de mission) → Inspecteur (grille, GPS, signature) → CPOP → Bureau (projet) → Directeur (signature avec code OTP affiché) → Demandeur (accusé) → Secrétariat (archivage).
4. Module AMM : `ACR-2026-0081` (expert → commission → bureau → DG). Registres : AMM `AMM/…/0084` retirée, AMM `…/0090` à renouveler.
5. **Vérifier un document** : saisissez le code d’un avis signé ou scannez le QR code du document imprimable.
6. **Journal d’audit** (profil DG) : « Simuler une altération » puis « Vérifier toute la chaîne ».

## Exigences couvertes

| ID | Où |
|---|---|
| F01 Rôles & habilitations par province | `lib/workflow.ts` (`canSee`, `ownerRole`), menu profil, matrice dans Référentiels |
| F02 Formulaires adaptatifs, brouillons, complétude | `/nouvelle-demande` (pièces selon procédure × catégorie, empreinte SHA-256 réelle, doublons) |
| F03 Numérotation unique, registre, suivi d’état | `ACR-AAAA-NNNN`, `/dossiers` (filtres, export CSV) |
| F04 Recevabilité, compléments, paiement | Panneau d’actions du dossier ; suspension du délai tracée |
| F05 Visites, grille annexe 04, preuves, PV | `/inspections`, `/inspections/[id]` (PV signé jamais écrasé) |
| F06 Avis CPOP, décision motivée, signature | Panneau d’actions (visas, contrôles préalables, MFA simulée) |
| F07 Notifications, accusés, PDF vérifiable | Cloche, `/documents/[id]` (impression PDF + QR), `/verifier` |
| F08 Tableaux de bord, délais, audit, recherche | `/tableau-de-bord`, 60 j.o. calculés, `/audit` chaîné, Ctrl K |
| F09 Référentiels | `/referentiels` (paramétrage des procédures) |
| F10 AMM, enregistrement, autres autorisations | `/modules`, `/registres`, procédures dans `lib/procedures.ts` |

## Structure

```
src/app/page.tsx                 Page d’accueil
src/app/(platform)/…/page.tsx    Pages (composant serveur : métadonnées + instant=false)
src/app/(platform)/…/view.tsx    Écrans client
src/app/documents/[id]           Documents imprimables vérifiables
src/lib/procedures.ts            Catalogue des procédures (moteur de workflow configurable)
src/lib/registres.ts             Registres des titres délivrés
src/lib/                         Types, référentiels, workflow, délais, SHA-256, seed, store
src/components/platform|dossier|landing|brand
```

Les montants de redevance, listes de pièces, textes et règles de délai sont indicatifs et restent à valider (§14 du cahier des charges).
