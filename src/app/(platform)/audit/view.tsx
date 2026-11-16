"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { Download, LoaderCircle, Search, ShieldAlert, ShieldCheck, Skull } from "lucide-react"
import { useCurrentUser, useRims, verifyChain } from "@/lib/store"
import { actorName, canSee } from "@/lib/workflow"
import { ROLES } from "@/lib/referentiels"
import { fmtDateTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Hash, PageHeader, StatusBadge } from "@/components/platform/bits"
import { cn } from "@/lib/utils"

export default function AuditPage() {
  const user = useCurrentUser()
  const events = useRims((s) => s.events)
  const dossiers = useRims((s) => s.dossiers)
  const tamper = useRims((s) => s.tamper)
  const [q, setQ] = useState("")
  const [state, setState] = useState<"idle" | "running" | "ok" | "ko">("idle")
  const [result, setResult] = useState<ReturnType<typeof verifyChain> | null>(null)
  const [limit, setLimit] = useState(60)

  const visibleIds = useMemo(() => new Set(dossiers.filter((d) => canSee(user, d)).map((d) => d.id)), [dossiers, user])
  const rows = useMemo(() => {
    const ql = q.toLowerCase()
    return events
      .map((e, idx) => ({ e, idx }))
      .filter(({ e }) => visibleIds.has(e.dossierId) && (!ql || [e.dossierId, e.action, actorName(e.actorId), e.comment ?? ""].join(" ").toLowerCase().includes(ql)))
      .reverse()
  }, [events, visibleIds, q])

  const run = async () => {
    setState("running")
    setResult(null)
    await new Promise((r) => setTimeout(r, 1400))
    const r = verifyChain(events)
    setResult(r)
    setState(r.ok ? "ok" : "ko")
    if (r.ok) toast.success("Intégrité vérifiée", { description: `${events.length} événements, chaîne SHA-256 intacte.` })
    else toast.error("Altération détectée", { description: `Rupture de chaîne à l’événement #${r.brokenAt}.` })
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows.map((r) => r.e), null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `journal-audit-acorep-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <>
      <PageHeader
        eyebrow="Traçabilité · append-only"
        title="Journal d’audit"
        description="Chaque action sensible est horodatée, attribuée et chaînée cryptographiquement à la précédente : toute modification a posteriori rompt la chaîne et devient détectable."
        actions={
          <>
            <Button variant="outline" className="h-9 rounded-xl" onClick={exportJson}><Download /> Exporter</Button>
            {user.role === "dg" && (
              <Button variant="ghost" className="h-9 rounded-xl text-rose-600" onClick={() => { tamper(); setState("idle"); toast("Un événement a été altéré hors circuit (démo)", { description: "Lancez la vérification." }) }}>
                <Skull /> Simuler une altération
              </Button>
            )}
          </>
        }
      />

      <div className="relative mb-6 overflow-hidden rounded-3xl border bg-card p-6">
        <div className="absolute inset-0 bg-dots opacity-50" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative grid size-24 shrink-0 place-items-center">
            <motion.div
              className={cn("absolute inset-0 rounded-full border-4", state === "ko" ? "border-rose-500/30" : "border-brand-green/25")}
              animate={state === "running" ? { rotate: 360 } : { rotate: 0 }}
              transition={state === "running" ? { repeat: Infinity, duration: 1.2, ease: "linear" } : {}}
              style={{ borderTopColor: state === "running" ? "var(--brand-green)" : undefined }}
            />
            <AnimatePresence mode="wait">
              <motion.div key={state} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                {state === "running" ? <LoaderCircle className="size-9 animate-spin text-brand-green" /> : state === "ko" ? <ShieldAlert className="size-10 text-rose-500" /> : <ShieldCheck className={cn("size-10", state === "ok" ? "text-brand-green" : "text-muted-foreground")} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <div className="font-heading text-xl font-bold">
              {state === "idle" && "Vérification d’intégrité"}
              {state === "running" && "Recalcul des empreintes…"}
              {state === "ok" && "Chaîne intègre"}
              {state === "ko" && "Rupture de chaîne détectée"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {state === "ko" && result?.event
                ? `L’événement #${result.brokenAt} (${result.event.dossierId} — « ${result.event.action} ») ne correspond plus à son empreinte. Toutes les entrées suivantes sont suspectes.`
                : `${events.length} événements · empreinte de tête `}
              {state !== "ko" && <Hash value={events.at(-1)?.hash ?? ""} />}
            </p>
          </div>
          <Button onClick={run} disabled={state === "running"} className="h-11 rounded-xl bg-brand-navy px-5 text-white hover:bg-brand-navy/90 dark:bg-sky-400 dark:text-slate-950">
            <ShieldCheck /> Vérifier toute la chaîne
          </Button>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par dossier, action, acteur, commentaire…" className="h-9 rounded-xl pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Horodatage</th>
                <th className="px-4 py-2.5 font-medium">Dossier</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Acteur</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Empreinte</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map(({ e, idx }) => {
                const broken = state === "ko" && result && idx >= result.brokenAt
                return (
                  <tr key={e.id} className={cn("border-b last:border-0", broken && "bg-rose-500/6")}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{idx}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">{fmtDateTime(e.at)}</td>
                    <td className="px-4 py-2.5"><Link href={`/dossiers/${e.dossierId}`} className="font-mono text-xs font-semibold hover:text-brand-green">{e.dossierId}</Link></td>
                    <td className="max-w-80 px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate">{e.action}</span>
                        {e.to && <StatusBadge status={e.to} />}
                      </div>
                      {e.comment && <div className={cn("truncate text-xs italic", broken && idx === result?.brokenAt ? "text-rose-600" : "text-muted-foreground")}>« {e.comment} »</div>}
                    </td>
                    <td className="hidden px-4 py-2.5 text-xs lg:table-cell">{actorName(e.actorId)}<div className="text-muted-foreground">{ROLES[e.role].short}</div></td>
                    <td className="hidden px-4 py-2.5 md:table-cell">{broken ? <span className="flex items-center gap-1 text-xs font-semibold text-rose-600"><ShieldAlert className="size-3.5" /> invalide</span> : <Hash value={e.hash} n={8} />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length > limit && (
          <div className="border-t p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLimit(limit + 80)}>Afficher plus ({rows.length - limit} restants)</Button>
          </div>
        )}
      </div>
    </>
  )
}
