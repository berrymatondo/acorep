"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Ban, Building2, Layers, MapPin, ShieldX } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { canSee } from "@/lib/workflow"
import { categoryById, moduleById } from "@/lib/referentiels"
import { PROCEDURES, procDef, subjectSubtitle, subjectTitle } from "@/lib/procedures"
import { DossierId, Empty, SlaRing, StatusBadge, TypeTag, WorkflowStepper } from "@/components/platform/bits"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DossierActions } from "@/components/dossier/dossier-actions"
import { AuditTab, DecisionTab, EvaluationTab, InspectionTab, OverviewTab, PaiementTab, PiecesTab, RecevabiliteTab } from "@/components/dossier/dossier-tabs"

export default function DossierPage() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const d = useRims((s) => s.dossiers.find((x) => x.id === id))
  const events = useRims((s) => s.events.reduce((n, e) => n + (e.dossierId === id ? 1 : 0), 0))

  if (!d) return <Empty icon={ShieldX} title="Dossier introuvable" text={`Aucun dossier ${id} dans le registre.`} />
  if (!canSee(user, d))
    return (
      <Empty
        icon={ShieldX}
        title="Accès refusé"
        text={`Le dossier ${id} relève de la province de ${d.province}. Votre habilitation ne permet pas de le consulter — tentative journalisée.`}
      />
    )

  const def = procDef(d.type)
  return (
    <>
      <Link href="/dossiers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Dossiers
      </Link>

      <div className="card-elevated relative mb-6 overflow-hidden p-5 md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-guilloche opacity-50" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DossierId id={d.id} className="text-base" />
              <TypeTag type={d.type} />
              <StatusBadge status={d.status} />
            </div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{subjectTitle(d)}</h1>
            {d.details?.nomCommercial && <p className="text-sm text-muted-foreground">{subjectSubtitle(d)}</p>}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building2 className="size-3.5" />{categoryById(d.categorie).label}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{d.etablissement.commune}, {d.province}</span>
              <span className="flex items-center gap-1.5"><Layers className="size-3.5" />{moduleById(def.module).short} · {PROCEDURES[d.type].label}</span>
            </div>
          </div>
          <SlaRing dossier={d} size={60} showLabel />
        </div>
        {d.decision?.retrait && (
          <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
            <Ban className="size-4" /> Décision retirée — {d.decision.retrait.motif}
          </div>
        )}
        <div className="relative mt-7 overflow-x-auto pb-1">
          <div className={def.stages.length > 8 ? "min-w-[720px]" : "min-w-[640px]"}>
            <WorkflowStepper dossier={d} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Tabs defaultValue="apercu" className="min-w-0">
          <TabsList className="mb-2 w-full justify-start overflow-x-auto rounded-xl p-1 scrollbar-none group-data-horizontal/tabs:h-auto [&>button]:h-8 [&>button]:flex-none">
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="pieces">Pièces <span className="ml-1 font-mono text-[10px] opacity-60">{d.pieces.length}</span></TabsTrigger>
            <TabsTrigger value="recevabilite">Recevabilité</TabsTrigger>
            {def.stages.includes("paiement") && <TabsTrigger value="paiement">Paiement</TabsTrigger>}
            {def.evaluation && <TabsTrigger value="evaluation">Évaluation</TabsTrigger>}
            {def.stages.includes("inspection") && <TabsTrigger value="inspection">Inspection</TabsTrigger>}
            <TabsTrigger value="decision">Décision</TabsTrigger>
            <TabsTrigger value="audit">Traçabilité <span className="ml-1 font-mono text-[10px] opacity-60">{events}</span></TabsTrigger>
          </TabsList>
          <TabsContent value="apercu"><OverviewTab d={d} /></TabsContent>
          <TabsContent value="pieces"><PiecesTab d={d} /></TabsContent>
          <TabsContent value="recevabilite"><RecevabiliteTab d={d} /></TabsContent>
          <TabsContent value="paiement"><PaiementTab d={d} /></TabsContent>
          <TabsContent value="evaluation"><EvaluationTab d={d} /></TabsContent>
          <TabsContent value="inspection"><InspectionTab d={d} /></TabsContent>
          <TabsContent value="decision"><DecisionTab d={d} /></TabsContent>
          <TabsContent value="audit"><AuditTab d={d} /></TabsContent>
        </Tabs>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="card-elevated relative overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-navy via-brand-green to-brand-lime" />
            <DossierActions key={d.status + user.id + (d.paiement?.inviteLe ?? "") + (d.paiement?.preuve ?? "") + (d.mission?.ordre ?? "") + (d.notification?.recuLe ?? "") + Object.keys(d.evaluation?.axes ?? {}).length} d={d} />
          </div>
        </aside>
      </div>
    </>
  )
}
