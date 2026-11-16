"use client"

import { useEffect, useRef, useState } from "react"
import { Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const c = ref.current!
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext("2d")!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#0b3a66"
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed bg-white">
        <canvas
          ref={ref}
          className="h-36 w-full touch-none"
          onPointerDown={(e) => {
            drawing.current = true
            const ctx = ref.current!.getContext("2d")!
            const p = pos(e)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ref.current!.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = ref.current!.getContext("2d")!
            const p = pos(e)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
            if (empty) setEmpty(false)
          }}
          onPointerUp={() => {
            drawing.current = false
            if (!empty) onChange(ref.current!.toDataURL("image/png"))
          }}
        />
        {empty && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-slate-400">
            Signez ici (souris, stylet ou doigt)
          </div>
        )}
        <div className="pointer-events-none absolute right-6 bottom-6 left-6 border-b border-slate-300" />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1"
        onClick={() => {
          const c = ref.current!
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height)
          setEmpty(true)
          onChange(null)
        }}
      >
        <Eraser /> Effacer
      </Button>
    </div>
  )
}
