import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] })
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] })
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "ACOREP · RIMS — Plateforme réglementaire pharmaceutique",
    template: "%s · ACOREP RIMS",
  },
  description:
    "Système de gestion de l’information réglementaire de l’Autorité Congolaise de Réglementation Pharmaceutique : dépôt en ligne, instruction, inspections, décisions et traçabilité.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geist.variable} ${bricolage.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
