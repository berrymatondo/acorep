"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Archive, ClipboardCheck, FileText, Gavel, PenLine, ScanSearch } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { icon: FileText, title: "Réception de la demande", text: "Dépôt en ligne d’un avis d’implantation ou d’un PV de constat. Numéro unique et accusé immédiat.", tag: "Secrétariat" },
  { icon: ClipboardCheck, title: "Vérification de la recevabilité", text: "Contrôle de conformité et de complétude selon l’annexe 02 ; compléments et suspension tracés.", tag: "Bureau" },
  { icon: ScanSearch, title: "Évaluation / inspection des lieux", text: "Ordre de mission, grille annexe 04, photos géolocalisées selon les Bonnes Pratiques.", tag: "Inspecteurs" },
  { icon: PenLine, title: "Rédaction du rapport / PV", text: "Procès-verbal signé sur le terrain, versionné, jamais écrasé.", tag: "Inspecteurs" },
  { icon: Gavel, title: "Décision (avis)", text: "Avis CPOP, motivation, visas et signature électronique par l’autorité habilitée.", tag: "CPOP · Directeur" },
  { icon: Archive, title: "Notification et archivage", text: "Transmission sécurisée avec preuve de réception, copie DG, classement annexe 08.", tag: "Secrétariat" },
]

export function ProcessFlow() {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-6">
        <svg className="pointer-events-none absolute top-9 right-[8%] left-[8%] hidden h-2 md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
          <line x1="0" y1="1" x2="100" y2="1" stroke="currentColor" className="text-border" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="1" x2="100" y2="1" stroke="var(--brand-green)" strokeWidth="2" strokeDasharray="6 14" vectorEffect="non-scaling-stroke" className="animate-flow" />
        </svg>
        {STEPS.map((s, i) => (
          <motion.button
            key={s.title}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group relative flex flex-col items-center text-center"
          >
            <div
              className={cn(
                "relative z-10 grid size-[72px] place-items-center rounded-2xl border-2 bg-card transition-all duration-300",
                active === i ? "scale-110 border-brand-green bg-brand-green text-white shadow-xl shadow-brand-green/25" : "border-border text-brand-navy group-hover:border-brand-green/50 dark:text-sky-300"
              )}
            >
              <s.icon className="size-7" />
              <span className={cn("absolute -top-2 -right-2 grid size-6 place-items-center rounded-full font-mono text-[11px] font-bold", active === i ? "bg-brand-navy text-white" : "bg-muted text-muted-foreground")}>{i + 1}</span>
            </div>
            <div className="mt-4 text-sm font-semibold leading-tight">{s.title}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.tag}</div>
          </motion.button>
        ))}
      </div>
      <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 max-w-2xl rounded-2xl border bg-card p-5 text-center">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-brand-green uppercase">Étape {active + 1}</div>
        <p className="mt-1 text-sm text-muted-foreground">{STEPS[active].text}</p>
      </motion.div>
    </div>
  )
}
