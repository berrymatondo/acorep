"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { useState, useSyncExternalStore } from "react"
import type { AuditEvent, Dossier, Role, Status } from "./types"
import { createSeed } from "./seed"
import { GENESIS, eventHash } from "./sha256"
import { USERS } from "./referentiels"

export interface Notif {
  id: string
  at: string
  dossierId: string
  text: string
  forRoles: Role[]
  ownerId?: string
  read: boolean
}

interface State {
  dossiers: Dossier[]
  events: AuditEvent[]
  notifs: Notif[]
  counter: number
  userId: string
  setUser: (id: string) => void
  /** Préférence d’affichage : menu latéral réduit aux icônes. */
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  /** Applique une action métier : modifie le dossier et l’inscrit au journal chaîné. */
  act: (
    dossierId: string,
    action: string,
    patch: (d: Dossier) => Partial<Dossier>,
    opts?: { comment?: string; notify?: { text: string; roles: Role[]; owner?: boolean } }
  ) => void
  createDossier: (d: Omit<Dossier, "id">, submit: boolean) => string
  markAllRead: () => void
  tamper: () => void
  reset: () => void
}

const seed = () => {
  const s = createSeed()
  return { dossiers: s.dossiers, events: s.events, counter: s.counter, notifs: [] as Notif[] }
}

export const useRims = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      userId: "u-bur",
      setUser: (id) => set({ userId: id }),
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      act: (dossierId, action, patch, opts) => {
        const { dossiers, events, userId, notifs } = get()
        const user = USERS.find((u) => u.id === userId)!
        const d = dossiers.find((x) => x.id === dossierId)
        if (!d) return
        const changes = patch(d)
        const next = { ...d, ...changes }
        const now = new Date().toISOString()
        const prevHash = events.at(-1)?.hash ?? GENESIS
        const ev = {
          id: `ev-${events.length}-${Date.now()}`,
          dossierId,
          at: now,
          actorId: userId,
          role: user.role,
          action,
          comment: opts?.comment,
          from: d.status,
          to: next.status !== d.status ? next.status : undefined,
          prevHash,
        }
        const newNotifs = opts?.notify
          ? [
              {
                id: `n-${Date.now()}`,
                at: now,
                dossierId,
                text: opts.notify.text,
                forRoles: opts.notify.roles,
                ownerId: opts.notify.owner ? d.ownerId : undefined,
                read: false,
              },
              ...notifs,
            ]
          : notifs
        set({
          dossiers: dossiers.map((x) => (x.id === dossierId ? next : x)),
          events: [...events, { ...ev, hash: eventHash(ev) }],
          notifs: newNotifs.slice(0, 40),
        })
      },
      createDossier: (data, submit) => {
        const { counter, dossiers, events, userId, notifs } = get()
        const n = counter + 1
        const id = `ACR-2026-${String(n).padStart(4, "0")}`
        const now = new Date().toISOString()
        const status: Status = submit ? "depose" : "brouillon"
        const d: Dossier = {
          ...data,
          id,
          status,
          submittedAt: submit ? now : undefined,
          receivedAt: submit ? now : undefined,
          accuseRef: submit ? `AR-${id.slice(4)}` : undefined,
        }
        let prev = events.at(-1)?.hash ?? GENESIS
        const mk = (action: string, from: Status | undefined, to: Status) => {
          const ev = { id: `ev-${events.length}-${Math.random().toString(36).slice(2, 7)}`, dossierId: id, at: now, actorId: userId, role: "demandeur" as Role, action, from, to, prevHash: prev }
          const hash = eventHash(ev)
          prev = hash
          return { ...ev, hash }
        }
        const newEvents = [mk("Brouillon créé", undefined, "brouillon")]
        if (submit) newEvents.push(mk("Dépôt en ligne — accusé de réception généré", "brouillon", "depose"))
        set({
          counter: n,
          dossiers: [d, ...dossiers],
          events: [...events, ...newEvents],
          notifs: submit
            ? [{ id: `n-${Date.now()}`, at: now, dossierId: id, text: `Nouveau dépôt ${id} à réceptionner`, forRoles: ["secretariat"], read: false }, ...notifs]
            : notifs,
        })
        return id
      },
      markAllRead: () => set({ notifs: get().notifs.map((n) => ({ ...n, read: true })) }),
      tamper: () => {
        // Démonstration : altère silencieusement un événement ancien
        const events = [...get().events]
        const i = Math.floor(events.length * 0.35)
        events[i] = { ...events[i], comment: (events[i].comment ?? "") + " [modifié hors circuit]" }
        set({ events })
      },
      reset: () => set({ ...seed() }),
    }),
    {
      name: "acorep-rims-demo-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Horodatage figé au montage du composant (rendu pur). */
export function useNow() {
  const [now] = useState(Date.now)
  return now
}

/** Vrai une fois l’état local restauré côté client (évite les écarts d’hydratation). */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useRims.persist.onFinishHydration(cb),
    () => useRims.persist.hasHydrated(),
    () => false
  )
}

export function useCurrentUser() {
  const userId = useRims((s) => s.userId)
  return USERS.find((u) => u.id === userId)!
}

export function verifyChain(events: AuditEvent[]) {
  let prev = GENESIS
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    if (e.prevHash !== prev || eventHash(e) !== e.hash) return { ok: false, brokenAt: i, event: e }
    prev = e.hash
  }
  return { ok: true as const, brokenAt: -1, event: undefined }
}
