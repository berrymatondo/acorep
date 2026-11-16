"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, ShieldCheck } from "lucide-react"
import { stagesFor } from "@/lib/workflow"

const STAGES = stagesFor({ type: "avis_implantation" })
import { sha256 } from "@/lib/sha256"
import { cn } from "@/lib/utils"

const ACTORS = ["Secrétariat provincial", "Bureau des établissements", "Cellule financière", "Inspecteur", "CPOP", "Bureau des établissements", "Directeur provincial", "Secrétariat provincial", "Secrétariat provincial"]

/** Carte héro : un dossier fictif traverse le circuit en boucle. */
export function LiveDossier() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % (STAGES.length + 2)), 1900)
    return () => clearInterval(t)
  }, [])
  const step = Math.min(i, STAGES.length - 1)
  const log = STAGES.slice(0, step + 1).map((s, k) => ({ s, actor: ACTORS[k], hash: sha256("ACR-2026-0042" + k) }))
  const consumed = Math.round((step / (STAGES.length - 1)) * 38)

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-green/30 via-sky-400/10 to-transparent blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">ACR-2026-0042</span>
              <span className="rounded-md border border-white/15 px-1.5 font-mono text-[10px] text-sky-200">AVIS</span>
            </div>
            <div className="mt-1 font-heading text-lg font-semibold text-white">Pharmacie Exemple</div>
            <div className="text-xs text-white/50">Officine · Lemba, Kinshasa</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-brand-lime">{60 - consumed}</div>
            <div className="text-[10px] text-white/50">j.o. restants</div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-1">
          {STAGES.map((s, k) => (
            <div key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full bg-gradient-to-r from-brand-green to-brand-lime" initial={false} animate={{ width: k < step ? "100%" : k === step ? "60%" : "0%" }} transition={{ duration: 0.6 }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <AnimatePresence mode="wait">
            <motion.span key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="font-semibold text-white">
              {STAGES[step].label}
            </motion.span>
          </AnimatePresence>
          <span className="text-white/40">{step + 1}/{STAGES.length}</span>
        </div>

        <div className="mt-4 flex h-[188px] flex-col gap-1.5 overflow-hidden mask-fade-b">
          <AnimatePresence initial={false}>
            {[...log].reverse().map((l, k) => (
              <motion.div
                key={l.s.id}
                layout
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={cn("flex items-center gap-3 rounded-xl border px-3 py-2", k === 0 ? "border-brand-green/40 bg-brand-green/10" : "border-white/5 bg-white/[0.03]")}
              >
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", k === 0 ? "bg-brand-green" : "bg-white/15")}>
                  <Check className="size-3 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-white">{l.s.hint}</div>
                  <div className="text-[10px] text-white/45">{l.actor}</div>
                </div>
                <code className="font-mono text-[9px] text-white/35">{l.hash.slice(0, 8)}</code>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] text-white/50">
          <ShieldCheck className="size-3.5 text-brand-lime" /> Chaque transition est signée, horodatée et chaînée (SHA-256)
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute -bottom-12 -left-8 hidden animate-float rounded-2xl border border-white/10 bg-brand-deep/90 p-3 shadow-xl backdrop-blur md:block"
      >
        <div className="text-[10px] text-white/50">Délai d’avis POS</div>
        <div className="font-heading text-2xl font-bold text-white">60 j.o.</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        style={{ animationDelay: "1.5s" }}
        className="absolute -top-8 left-10 hidden animate-float items-center gap-2 rounded-2xl border border-white/10 bg-white p-2.5 pr-4 shadow-xl md:flex"
      >
        <span className="grid size-8 place-items-center rounded-xl bg-brand-green text-white"><Check className="size-4" /></span>
        <div>
          <div className="text-[10px] text-slate-500">Document vérifiable</div>
          <div className="font-mono text-xs font-bold text-slate-900">QR · 3F9A21C07B</div>
        </div>
      </motion.div>
    </div>
  )
}
