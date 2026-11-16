import type { Metadata } from "next"
import View from "./view"

export const metadata: Metadata = { title: "Registres" }

// Données lues dans le navigateur (aucune base de données) : écran rendu côté client.
export const instant = false

export default function Page() {
  return <View />
}
