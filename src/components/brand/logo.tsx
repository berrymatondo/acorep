import { cn } from "@/lib/utils"

/** Logo officiel ACOREP (public/acorep-logo.png, fond transparent). */
export function LogoMark({ className, tile = false }: { className?: string; tile?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/acorep-logo.png" alt="" aria-hidden className={cn("size-9 object-contain", !tile && className)} />
  )
  if (!tile) return img
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5", className)}>
      {img}
    </span>
  )
}

export function Logo({
  className,
  tone = "default",
  subtitle = true,
}: {
  className?: string
  tone?: "default" | "light"
  subtitle?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark tile={tone === "light"} />
      <div className="leading-none">
        <div
          className={cn(
            "font-heading text-[1.35rem] font-extrabold tracking-tight",
            tone === "light" ? "text-white" : "text-brand-navy dark:text-white"
          )}
        >
          A<span className="text-brand-green">C</span>OREP
        </div>
        {subtitle && (
          <div
            className={cn(
              "mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em]",
              tone === "light" ? "text-white/60" : "text-muted-foreground"
            )}
          >
            RIMS · Réglementation
          </div>
        )}
      </div>
    </div>
  )
}
