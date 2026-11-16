import { format, formatDistanceToNowStrict } from "date-fns"
import { fr } from "date-fns/locale"
import type { Dossier } from "./types"
import { DELAIS } from "./procedures"

export const SLA_AVIS = 60 // jours ouvrables (POS)
export const DELAI_PV = 90 // jours calendaires après notification

export function isBusinessDay(d: Date) {
  const day = d.getDay()
  return day !== 0 && day !== 6
}

/** Nombre de jours ouvrables écoulés entre deux dates (début exclu, fin incluse). */
export function businessDaysBetween(start: Date, end: Date) {
  if (end <= start) return 0
  let count = 0
  const d = new Date(start)
  d.setHours(12, 0, 0, 0)
  const e = new Date(end)
  e.setHours(12, 0, 0, 0)
  while (d < e) {
    d.setDate(d.getDate() + 1)
    if (isBusinessDay(d)) count++
  }
  return count
}

export function addBusinessDays(start: Date, n: number) {
  const d = new Date(start)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    if (isBusinessDay(d)) added++
  }
  return d
}

export interface SlaInfo {
  consumed: number
  suspended: number
  remaining: number
  total: number
  ratio: number
  level: "ok" | "warn" | "danger" | "done" | "na"
  deadline?: Date
}

export function computeSla(d: Dossier, now = new Date()): SlaInfo {
  const total = DELAIS[d.type] ?? SLA_AVIS
  if (!d.receivedAt) return { consumed: 0, suspended: 0, remaining: total, total, ratio: 0, level: "na" }
  const start = new Date(d.receivedAt)
  const end = d.notification ? new Date(d.notification.envoyeLe) : now
  const gross = businessDaysBetween(start, end)
  const suspended = d.suspensions.reduce((acc, s) => {
    const sEnd = s.fin ? new Date(s.fin) : end
    return acc + businessDaysBetween(new Date(s.debut), sEnd)
  }, 0)
  const consumed = Math.max(0, gross - suspended)
  const remaining = total - consumed
  const ratio = Math.min(1, consumed / total)
  const done = !!d.notification
  const level: SlaInfo["level"] = done ? "done" : ratio >= 0.85 ? "danger" : ratio >= 0.6 ? "warn" : "ok"
  const deadline = addBusinessDays(start, total + suspended)
  return { consumed, suspended, remaining, total, ratio, level, deadline }
}

export function fmtDate(iso?: string | Date, pattern = "d MMM yyyy") {
  if (!iso) return "—"
  return format(new Date(iso), pattern, { locale: fr })
}

export function fmtDateTime(iso?: string | Date) {
  return fmtDate(iso, "d MMM yyyy 'à' HH:mm")
}

export function fromNow(iso?: string) {
  if (!iso) return "—"
  return formatDistanceToNowStrict(new Date(iso), { locale: fr, addSuffix: true })
}

export function daysAgo(n: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
