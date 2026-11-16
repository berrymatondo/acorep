import type { Metadata } from "next"
import View from "./view"

export const metadata: Metadata = { title: "Documentation" }

// Écran client (recherche, sommaire actif) : rendu côté navigateur comme les autres pages.
export const instant = false

export default function Page() {
  return <View />
}
