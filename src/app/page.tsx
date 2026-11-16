import Link from "next/link"
import {
  ArrowRight, BarChart3, Bell, CreditCard, FileCheck, FolderOpen, Globe, Hospital, KeyRound, Lock, MapPin, Pill, QrCode,
  ScanSearch, ShieldCheck, Sparkles, Timer, Workflow, History, Building2, Ellipsis, Check,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { MODULES } from "@/lib/referentiels"
import { PROCEDURE_DEFS } from "@/lib/procedures"
import { Button } from "@/components/ui/button"
import { LiveDossier } from "@/components/landing/live-dossier"
import { ProcessFlow } from "@/components/landing/process-flow"
import { PersonaGrid } from "@/components/landing/persona-grid"
import { LandingThemeToggle } from "@/components/landing/theme-toggle"

const MODULE_ICONS: Record<string, React.ElementType> = { etablissements: Building2, produits: Pill, amm: FileCheck, medicaux: Hospital, autres: Ellipsis }

const SERVICES = [
  { icon: Workflow, label: "Workflow configurable" },
  { icon: FolderOpen, label: "e-Dossier versionné" },
  { icon: ScanSearch, label: "Inspections terrain" },
  { icon: CreditCard, label: "Redevances" },
  { icon: Bell, label: "Notifications" },
  { icon: BarChart3, label: "Tableaux de bord" },
]

const TRUST = [
  { icon: History, title: "Journal inviolable", text: "Chaque action est chaînée par empreinte SHA-256 : toute altération est détectée." },
  { icon: Lock, title: "Cloisonnement par province", text: "RBAC et moindre privilège : un agent ne lit que les dossiers de son ressort." },
  { icon: KeyRound, title: "Signature à authentification forte", text: "Les décisions sont signées après MFA par l’autorité habilitée." },
  { icon: Timer, title: "Délais maîtrisés", text: "60 jours ouvrables calculés automatiquement, suspensions justifiées tracées." },
  { icon: QrCode, title: "Documents vérifiables", text: "Chaque avis porte un QR code et un code contrôlable publiquement." },
  { icon: Globe, title: "Interopérable", text: "API versionnée, identifiants stables, exports documentés." },
]

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-deep text-white">
        <div className="absolute inset-0 bg-grid-light mask-radial" />
        <div className="absolute inset-0 bg-guilloche opacity-30" />
        <div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-brand-green/25 blur-[120px]" />
        <div className="absolute top-20 right-0 size-[420px] rounded-full bg-sky-500/20 blur-[120px]" />
        <svg className="absolute -right-40 -bottom-40 size-[620px] animate-spin-slow text-white/5" viewBox="0 0 200 200" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <ellipse key={i} cx="100" cy="100" rx="90" ry="34" fill="none" stroke="currentColor" strokeWidth="0.4" transform={`rotate(${i * 7.5} 100 100)`} />
          ))}
        </svg>

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Logo tone="light" />
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#processus" className="hover:text-white">Processus</a>
            <a href="#profils" className="hover:text-white">Profils</a>
            <a href="#modules" className="hover:text-white">Modules</a>
            <a href="#securite" className="hover:text-white">Sécurité</a>
            <Link href="/verifier" className="hover:text-white">Vérifier un document</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LandingThemeToggle />
            <Button asChild className="h-9 rounded-xl bg-white px-4 text-brand-deep hover:bg-white/90">
              <Link href="#profils">Accéder</Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pt-10 pb-24 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
              <Sparkles className="size-3.5 text-brand-lime" />
              Regulatory Information Management System
            </div>
            <h1 className="font-heading text-4xl leading-[1.04] font-extrabold tracking-tight md:text-5xl xl:text-[4rem]">
              La réglementation pharmaceutique,
              <br />
              <span className="text-shine">tracée de bout en bout.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/70 md:text-lg">
              Une plateforme unique pour déposer, instruire, inspecter, décider et notifier — dans les 26 provinces, avec des délais maîtrisés et
              un historique que personne ne peut réécrire.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl bg-brand-green px-6 text-base text-white shadow-lg shadow-brand-green/30 hover:bg-brand-green/90">
                <Link href="#profils">
                  Explorer la plateforme <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white">
                <Link href="/verifier">
                  <QrCode /> Vérifier un document
                </Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["60", "jours ouvrables pour l’avis"],
                [String(PROCEDURE_DEFS.length), "procédures réglementaires"],
                ["100 %", "actions historisées"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-heading text-3xl font-bold">{v}</dt>
                  <dd className="mt-1 text-xs text-white/50">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:pl-6">
            <LiveDossier />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-green/60 to-transparent" />
      </section>

      {/* PROCESSUS */}
      <section id="processus" className="relative py-24">
        <div className="absolute inset-0 bg-dots opacity-40 mask-radial" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-brand-green uppercase">POS AQ-POS-ENR-001-26</div>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">Le processus d’instruction, numérisé fidèlement</h2>
            <p className="mt-4 text-muted-foreground">Six étapes, des responsabilités claires, chaque transition enregistrée avec son auteur, son rôle, sa date et sa preuve.</p>
          </div>
          <ProcessFlow />
        </div>
      </section>

      {/* PROFILS */}
      <section id="profils" className="relative border-y bg-paper py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-[0.25em] text-brand-green uppercase">Démonstration interactive</div>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">Entrez avec un profil</h2>
              <p className="mt-4 text-muted-foreground">
                Chaque acteur de la POS dispose de ses écrans et de ses habilitations. Faites avancer un dossier de bout en bout en changeant de profil à tout moment.
              </p>
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">Données entièrement fictives, conservées uniquement dans votre navigateur. Aucune base de données.</p>
          </div>
          <PersonaGrid />
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-brand-green uppercase">Vision RIMS</div>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">Un socle, toutes les procédures</h2>
            <p className="mt-4 text-muted-foreground">
              {MODULES.length} modules et {PROCEDURE_DEFS.length} procédures opérationnels sur le même moteur de workflow et les mêmes services transverses.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => {
              const Icon = MODULE_ICONS[m.id]
              const procs = PROCEDURE_DEFS.filter((p) => p.module === m.id)
              const featured = i === 0
              return (
                <div key={m.id} className={`group relative overflow-hidden rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${featured ? "bg-brand-deep text-white" : "bg-card"}`}>
                  {featured && <div className="absolute inset-0 bg-guilloche opacity-40" />}
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: m.color }} />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl text-white" style={{ background: m.color }}>
                        <Icon className="size-6" />
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${featured ? "bg-brand-lime text-brand-deep" : "border text-muted-foreground"}`}>
                        {procs.length} procédure{procs.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <h3 className="mt-6 font-heading text-xl font-semibold">{m.label}</h3>
                    <ul className="mt-3 space-y-1.5">
                      {m.points.map((p) => (
                        <li key={p} className={`flex gap-2 text-sm ${featured ? "text-white/70" : "text-muted-foreground"}`}>
                          <Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> {p}
                        </li>
                      ))}
                    </ul>
                    <div className={`mt-5 border-t pt-4 text-xs ${featured ? "border-white/10 text-white/60" : "text-muted-foreground"}`}>
                      Délivrable : <b className={featured ? "text-white" : "text-foreground"}>{m.deliverable}</b>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
            {SERVICES.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center">
                <s.icon className="size-5 text-brand-green" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SÉCURITÉ */}
      <section id="securite" className="relative overflow-hidden bg-brand-deep py-24 text-white">
        <div className="absolute inset-0 bg-grid-light opacity-70" />
        <div className="absolute top-0 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-brand-green/15 blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-14 max-w-2xl">
            <ShieldCheck className="mb-4 size-10 text-brand-lime" />
            <h2 className="text-3xl font-bold md:text-5xl">Conçu pour la confiance</h2>
            <p className="mt-4 text-white/60">Conformité, traçabilité et transparence au service de la sécurité des patients et de la qualité des soins.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title} className="bg-brand-deep p-7 transition-colors hover:bg-white/[0.04]">
                <t.icon className="size-6 text-brand-lime" />
                <h3 className="mt-4 font-heading text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm text-white/55">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-green to-emerald-700 p-10 text-white md:p-16">
            <div className="absolute inset-0 bg-guilloche opacity-50 mix-blend-overlay" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">Prêt à instruire votre premier dossier ?</h2>
                <p className="mt-2 text-white/80">Déposez une demande comme pharmacien, puis suivez-la jusqu’à la signature.</p>
              </div>
              <Button asChild size="lg" className="h-12 rounded-xl bg-white px-6 text-base text-brand-deep hover:bg-white/90">
                <Link href="#profils">Commencer <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <p className="max-w-xl text-xs text-muted-foreground">
            Prototype conforme au cahier des charges ACOREP-RIMS v1.0. Références : Ordonnance-loi n° 95-018, Loi n° 18/035, Arrêté n° 1250/CAB/MIN/S/AJ/01, OMS GBT, BPF/BPD/BPI/BPP — versions à confirmer par le service juridique.
          </p>
        </div>
      </footer>
    </div>
  )
}
