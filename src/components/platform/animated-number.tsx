"use client"

import { useEffect, useRef } from "react"
import { animate } from "motion/react"

const fmt = (v: number, decimals: number, suffix: string) => v.toFixed(decimals).replace(".", ",") + suffix

/** Affiche la valeur finale d’emblée (accessible, sans JS) puis l’anime de 0 à la valeur au montage. */
export function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const c = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (node.textContent = fmt(v, decimals, suffix)),
      onComplete: () => (node.textContent = fmt(value, decimals, suffix)),
    })
    return () => {
      c.stop()
      node.textContent = fmt(value, decimals, suffix)
    }
  }, [value, suffix, decimals])
  return <span ref={ref}>{fmt(value, decimals, suffix)}</span>
}
