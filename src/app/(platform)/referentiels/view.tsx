"use client"

import { ArrowRight, Check, FileText, Minus } from "lucide-react"
import { ANNEXES, CATEGORIES, GRILLES, MODULES, PROVINCES, ROLES, TEXTES, type CategoryGroup } from "@/lib/referentiels"
import { DELAIS, checklistFor, proceduresOf, requiredPieces, stageLabel, categoriesFor } from "@/lib/procedures"
import { useRims } from "@/lib/store"
import type { Role } from "@/lib/types"
import { PageHeader } from "@/components/platform/bits"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const MATRIX: { action: string; roles: Role[] }[] = [
  { action: "Créer / soumettre une demande", roles: ["demandeur"] },
  { action: "Réceptionner, numéroter, orienter, archiver", roles: ["secretariat"] },
  { action: "Contrôler la recevabilité, demander des compléments", roles: ["bureau"] },
  { action: "Émettre l’invitation / valider le paiement", roles: ["finance"] },
  { action: "Évaluer qualité, sécurité, efficacité, vigilance", roles: ["expert"] },
  { action: "Vérifier les exigences (établissements médicaux)", roles: ["bureau"] },
  { action: "Émettre l’ordre de mission / dispenser d’inspection", roles: ["bureau"] },
  { action: "Saisir la grille et signer le PV", roles: ["inspecteur"] },
  { action: "Avis CPOP (implantation)", roles: ["cpop"] },
  { action: "Avis de la commission (enregistrement, AMM)", roles: ["commission"] },
  { action: "Rédiger et viser le projet de décision", roles: ["bureau"] },
  { action: "Signer les décisions provinciales", roles: ["directeur"] },
  { action: "Signer les décisions nationales, retirer une AMM", roles: ["dg"] },
  { action: "Consulter le journal d’audit", roles: ["bureau", "directeur", "dg"] },
  { action: "Vue nationale toutes provinces", roles: ["dg"] },
]
const ROLE_ORDER: Role[] = ["demandeur", "secretariat", "bureau", "expert", "inspecteur", "finance", "cpop", "commission", "directeur", "dg"]
const GROUP_LABEL: Record<CategoryGroup, string> = { pharma: "Établissements pharmaceutiques", produit: "Produits de santé", medical: "Établissements médicaux" }

export default function ReferentielsPage() {
  const dossiers = useRims((s) => s.dossiers)
  return (
    <>
      <PageHeader eyebrow="Référentiels · F09" title="Référentiels réglementaires" description="Paramétrage du moteur de workflow par module et procédure, catégories, pièces, grilles, textes et matrice d’habilitations. Listes à valider en atelier métier (§14)." />
      <Tabs defaultValue="procedures">
        <TabsList className="mb-4 h-auto flex-wrap justify-start rounded-xl p-1">
          <TabsTrigger value="procedures">Modules & procédures</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="habilitations">Habilitations</TabsTrigger>
          <TabsTrigger value="grille">Grilles d’inspection</TabsTrigger>
          <TabsTrigger value="textes">Textes</TabsTrigger>
          <TabsTrigger value="annexes">Annexes POS</TabsTrigger>
          <TabsTrigger value="provinces">Provinces</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures" className="space-y-8">
          {MODULES.map((m) => (
            <section key={m.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="size-3 rounded" style={{ background: m.color }} />
                <h2 className="font-heading text-lg font-semibold">{m.label}</h2>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {proceduresOf(m.id).map((p) => (
                  <div key={p.id} className="card-elevated p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-semibold">{p.label}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-lg font-bold">{DELAIS[p.id]}</div>
                        <div className="text-[10px] text-muted-foreground">j.o.</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-1">
                      {p.stages.map((s, i) => (
                        <span key={s} className="flex items-center gap-1">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{stageLabel(p.id, s).label}</span>
                          {i < p.stages.length - 1 && <ArrowRight className="size-3 text-muted-foreground/50" />}
                        </span>
                      ))}
                    </div>
                    <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="mb-1 font-semibold text-muted-foreground uppercase">Pièces exigibles</dt>
                        <ul className="space-y-0.5">{requiredPieces(p.id, categoriesFor(p.id)[0].id).map((x) => <li key={x.id} className="flex gap-1.5"><Check className="mt-0.5 size-3 shrink-0 text-brand-green" />{x.label}</li>)}</ul>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <dt className="mb-1 font-semibold text-muted-foreground uppercase">Recevabilité</dt>
                          <dd>{checklistFor(p.id).length} points de contrôle</dd>
                        </div>
                        {p.evaluation && (
                          <div>
                            <dt className="mb-1 font-semibold text-muted-foreground uppercase">{p.evaluation.label}</dt>
                            <dd>{p.evaluation.axes.map((a) => a.label).join(" · ")} <span className="text-muted-foreground">({ROLES[p.evaluation.role].short})</span></dd>
                          </div>
                        )}
                        {p.commission && (
                          <div>
                            <dt className="mb-1 font-semibold text-muted-foreground uppercase">Avis collégial</dt>
                            <dd>{p.commission.label}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="mb-1 font-semibold text-muted-foreground uppercase">Décision</dt>
                          <dd>
                            Signée par {ROLES[p.signataire].label.toLowerCase()} · {p.outcomes.map((o) => o.label).join(" / ")}
                            {p.validiteMois ? ` · validité ${p.validiteMois} mois` : ""}
                          </dd>
                        </div>
                        {p.parent && (
                          <div>
                            <dt className="mb-1 font-semibold text-muted-foreground uppercase">Prérequis</dt>
                            <dd>{p.parent.label}{p.parent.delaiJours ? ` (≤ ${p.parent.delaiJours} jours)` : ""}</dd>
                          </div>
                        )}
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {(Object.keys(GROUP_LABEL) as CategoryGroup[]).map((g) => (
            <section key={g}>
              <h2 className="mb-3 font-heading font-semibold">{GROUP_LABEL[g]}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {CATEGORIES.filter((c) => c.group === g).map((c) => (
                  <div key={c.id} className="card-elevated p-4">
                    <div className="font-semibold">{c.label}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                    <div className="mt-3 flex gap-2 text-xs">
                      <span className="rounded-full bg-muted px-2 py-0.5">{c.bp}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5">Redevance de base {c.redevance} $</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        <TabsContent value="habilitations">
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Action</th>
                  {ROLE_ORDER.map((r) => (
                    <th key={r} className="px-2 py-3 text-center text-[11px] font-semibold">{ROLES[r].short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((m) => (
                  <tr key={m.action} className="border-b last:border-0">
                    <td className="px-4 py-2.5">{m.action}</td>
                    {ROLE_ORDER.map((r) => (
                      <td key={r} className="px-2 py-2.5 text-center">
                        {m.roles.includes(r) ? (
                          <span className="inline-grid size-6 place-items-center rounded-full bg-brand-green text-white" aria-label="Autorisé"><Check className="size-3.5" /></span>
                        ) : (
                          <Minus className="mx-auto size-3.5 text-muted-foreground/30" aria-label="Non autorisé" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Principe du moindre privilège ; agents cloisonnés par province, la Direction générale traite les procédures nationales et supervise.</p>
        </TabsContent>

        <TabsContent value="grille" className="grid gap-4 lg:grid-cols-2">
          {Object.entries(GRILLES).map(([k, items]) => (
            <div key={k} className="card-elevated overflow-hidden">
              <div className="border-b px-5 py-3 font-heading font-semibold">{k === "pharma" ? "Établissements pharmaceutiques (annexe 04)" : "Établissements médicaux"}</div>
              <div className="divide-y">
                {items.map((g, i) => (
                  <div key={g.id} className="flex items-center gap-4 px-5 py-2.5 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{g.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{g.section}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="textes">
          <div className="grid gap-3 md:grid-cols-2">
            {TEXTES.map((t) => (
              <div key={t.ref} className="card-elevated flex gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-navy/8 text-brand-navy dark:text-sky-300"><FileText className="size-5" /></span>
                <div>
                  <div className="font-mono text-sm font-semibold">{t.ref}</div>
                  <div className="text-sm">{t.objet}</div>
                  <div className={cn("mt-1 text-xs", t.statut.startsWith("À") ? "text-amber-600" : "text-brand-green")}>{t.statut}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="annexes">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ANNEXES.map((a) => (
              <div key={a.n} className="card-elevated relative overflow-hidden p-5">
                <div className="absolute -top-3 -right-1 font-heading text-7xl font-black text-brand-green/8">{a.n}</div>
                <div className="text-[11px] font-semibold tracking-wider text-brand-green uppercase">Annexe {a.n}</div>
                <div className="mt-1 font-medium">{a.titre}</div>
                <div className="mt-2 text-xs text-muted-foreground">Numérisée — valeur réglementaire conservée</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="provinces">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PROVINCES.map((p) => {
              const n = dossiers.filter((d) => d.province === p).length
              return (
                <div key={p} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
                  <span>{p}</span>
                  <span className={cn("font-mono text-xs", n ? "font-semibold" : "text-muted-foreground")}>{n ? `${n} dossiers` : "déploiement à venir"}</span>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
