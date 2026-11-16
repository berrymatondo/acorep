import { Suspense } from "react"
import { AppShell } from "@/components/platform/app-shell"


function ShellFallback() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 bg-sidebar lg:block" />
      <div className="flex-1 p-8">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}
