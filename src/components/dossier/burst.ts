/** Petite gerbe de particules (sans dépendance) pour célébrer une décision signée. */
export default function confettiBurst() {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const colors = ["#2e9f55", "#9bd35a", "#0b3a66", "#3b82c4", "#ffffff"]
  const root = document.createElement("div")
  root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden"
  document.body.appendChild(root)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2.4
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("span")
    const size = 5 + Math.random() * 7
    el.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size * 0.45}px;background:${colors[i % colors.length]};border-radius:2px`
    root.appendChild(el)
    const angle = Math.random() * Math.PI * 2
    const dist = 140 + Math.random() * 320
    el.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 260}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 1300 + Math.random() * 900, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }
    )
  }
  setTimeout(() => root.remove(), 2400)
}
