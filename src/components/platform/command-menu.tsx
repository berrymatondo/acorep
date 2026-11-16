"use client"

import { subjectTitle } from "@/lib/procedures"
import { useRouter } from "next/navigation"
import { BookOpen, Boxes, FileText, FolderOpen, History, Inbox, LayoutDashboard, Library, Plus, QrCode, Radar } from "lucide-react"
import { useCurrentUser, useRims } from "@/lib/store"
import { canSee } from "@/lib/workflow"
import { STATUS_META } from "@/lib/referentiels"
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const user = useCurrentUser()
  const dossiers = useRims((s) => s.dossiers).filter((d) => canSee(user, d))
  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }
  const pages = [
    { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/travail", label: "File de travail", icon: Inbox },
    { href: "/modules", label: "Modules réglementaires", icon: Boxes },
    { href: "/dossiers", label: "Tous les dossiers", icon: FolderOpen },
    { href: "/registres", label: "Registres (titres délivrés)", icon: Library },
    { href: "/nouvelle-demande", label: "Nouvelle demande", icon: Plus },
    { href: "/inspections", label: "Inspections", icon: Radar },
    { href: "/audit", label: "Journal d’audit", icon: History },
    { href: "/verifier", label: "Vérifier un document", icon: QrCode },
    { href: "/documentation", label: "Documentation", icon: BookOpen },
  ]
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Recherche" description="Rechercher un dossier ou une page">
      <Command>
        <CommandInput placeholder="N° de dossier, produit, DCI, établissement, commune…" />
        <CommandList>
          <CommandEmpty>Aucun résultat dans votre périmètre d’habilitation.</CommandEmpty>
          <CommandGroup heading={`Dossiers (${dossiers.length} accessibles)`}>
            {dossiers.map((d) => (
              <CommandItem
                key={d.id}
                value={`${d.id} ${subjectTitle(d)} ${d.details?.dci ?? ""} ${d.etablissement.nom} ${d.etablissement.commune} ${d.promoteur.nom} ${d.province}`}
                onSelect={() => go(`/dossiers/${d.id}`)}
              >
                <FileText className="text-brand-green" />
                <span className="font-mono text-xs font-semibold">{d.id}</span>
                <span className="truncate">{subjectTitle(d)}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{STATUS_META[d.status].label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            {pages.map((p) => (
              <CommandItem key={p.href} value={p.label} onSelect={() => go(p.href)}>
                <p.icon />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
