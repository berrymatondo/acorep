"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { CircleCheck, LoaderCircle, Upload } from "lucide-react"
import { hashFile } from "@/lib/sha256"
import { cn } from "@/lib/utils"

export interface HashedFile {
  nom: string
  taille: number
  hash: string
}

export function fmtSize(n: number) {
  return n > 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} Mo` : `${Math.round(n / 1000)} Ko`
}

/** Zone de dépôt : calcule l’empreinte SHA-256 réelle du fichier dans le navigateur. */
export function FileDrop({
  label,
  hint,
  value,
  onFile,
  compact = false,
}: {
  label: string
  hint?: string
  value?: HashedFile | null
  onFile: (f: HashedFile) => void
  compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const handle = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const hash = await hashFile(file)
    await new Promise((r) => setTimeout(r, 350))
    setBusy(false)
    onFile({ nom: file.name, taille: file.size, hash })
  }

  return (
    <div
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        handle(e.dataTransfer.files[0])
      }}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-card transition-all hover:border-brand-green/60 hover:bg-accent/30",
        compact ? "p-2.5" : "p-3.5",
        over && "border-brand-green bg-accent/50",
        value && "border-solid border-brand-green/40 bg-accent/40"
      )}
    >
      <input ref={input} type="file" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-lg",
          compact ? "size-8" : "size-10",
          value ? "bg-brand-green text-white" : "bg-muted text-muted-foreground group-hover:text-brand-green"
        )}
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : value ? <CircleCheck className="size-4" /> : <Upload className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{label}</div>
        {value ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate font-mono text-[10.5px] text-muted-foreground">
            {value.nom} · {fmtSize(value.taille)} · sha256 {value.hash.slice(0, 12)}…
          </motion.div>
        ) : (
          <div className="truncate text-xs text-muted-foreground">{busy ? "Calcul de l’empreinte SHA-256…" : hint ?? "Glisser-déposer ou cliquer"}</div>
        )}
      </div>
    </div>
  )
}
