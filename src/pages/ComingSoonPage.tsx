import { useEffect, useRef } from "react"

import { assetUrl, cn } from "@/lib/utils"

const AUDIENCES = [
  {
    title: "For photographers",
    text: "Book events, upload galleries, manage orders and track your sales all in one place.",
  },
  {
    title: "For event teams",
    text: "Find the right photographers, coordinate coverage, and help riders discover their photos.",
  },
  {
    title: "For riders",
    text: "Search your event, spot your photos, and purchase your favorites from horse competitions across Sweden.",
  },
]

/** Staggered fade-up entrance; `delay` in ms */
const fadeUp = (delay: string) =>
  cn(
    "slide-in-from-bottom-3.5 animate-in duration-900 fill-mode-both fade-in",
    delay
  )

/** Slowly drifting white dots behind the content */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animFrame: number
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      a: number
    }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.3 + 0.05,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.a})`
        ctx.fill()
      })
      animFrame = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener("resize", resize)
    }
  }, [canvasRef])
}

export function ComingSoonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useParticles(canvasRef)

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-[linear-gradient(160deg,#020b1a_0%,#040136_50%,#07022a_100%)]">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 size-[min(760px,95vw)] animate-cs-glow-pulse rounded-full bg-[radial-gradient(circle,rgba(27,58,236,0.2)_0%,transparent_68%)]"
        aria-hidden="true"
      />

      <div className="flex-1" />

      <main className="relative z-1 flex w-full flex-none flex-col items-center px-8 pt-12 pb-8 text-center max-[480px]:px-5">
        <div className="mb-8 animate-in duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] fill-mode-both zoom-in-95 fade-in slide-in-from-bottom-7">
          <img
            src={assetUrl("images/logo1-blue.svg")}
            alt="Gallopics"
            draggable={false}
            className="block h-auto w-[min(340px,58vw)] opacity-96 brightness-0 invert select-none max-[480px]:w-[60vw]"
          />
        </div>

        <div
          className={cn(
            "mb-6 h-px w-8 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]",
            fadeUp("delay-350")
          )}
          aria-hidden="true"
        />

        <h1
          className={cn(
            "mb-2.5 text-[clamp(1.15rem,2.4vw,1.6rem)] leading-[1.2] font-semibold tracking-[-0.015em] text-white",
            fadeUp("delay-500")
          )}
        >
          Event galleries are almost ready.
        </h1>

        <p
          className={cn(
            "mb-8 max-w-140 text-[clamp(0.8rem,1.4vw,0.9rem)] leading-[1.65] tracking-[0.01em] text-white/38",
            fadeUp("delay-650")
          )}
        >
          Built for the people behind the camera, the events in motion, and the
          riders looking for their favorite moments.
        </p>

        <div
          className={cn(
            "mb-7 grid w-[min(780px,calc(100vw-48px))] grid-cols-3 gap-3 max-[760px]:mb-6 max-[760px]:w-[min(420px,calc(100vw-40px))] max-[760px]:grid-cols-1 max-[760px]:gap-2",
            fadeUp("delay-800")
          )}
        >
          {AUDIENCES.map((audience) => (
            <section
              key={audience.title}
              className="min-h-33 rounded-2xl border border-white/10 bg-white/5.5 p-4 text-left backdrop-blur-[18px] max-[760px]:min-h-0 max-[760px]:px-3.75 max-[760px]:py-3.5"
            >
              <span className="mb-2.5 block text-[0.68rem] leading-[1.2] font-bold tracking-[0.11em] text-white/86 uppercase">
                {audience.title}
              </span>
              <p className="text-[0.78rem] leading-[1.55] text-white/54">
                {audience.text}
              </p>
            </section>
          ))}
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[0.72rem] font-medium tracking-[0.1em] text-white/55 uppercase",
            fadeUp("delay-800")
          )}
        >
          <span
            className="size-1.5 shrink-0 animate-cs-dot-pulse rounded-full bg-primary"
            aria-hidden="true"
          />
          Launching Soon
        </div>
      </main>

      <div className="flex-1" />

      <footer
        className={cn(
          "relative z-1 w-full flex-none px-4 py-6 text-center text-[0.7rem] text-white/16",
          fadeUp("delay-950")
        )}
      >
        © {new Date().getFullYear()} Gallopics. All rights reserved.
      </footer>
    </div>
  )
}
