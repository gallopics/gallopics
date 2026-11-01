import { Link } from "react-router"
import { CircleAlert, LoaderCircle } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"

interface PageStateProps {
  title: string
  description: string
  onRetry?: () => void
  retrying?: boolean
  loading?: boolean
}

export function PageState({
  title,
  description,
  onRetry,
  retrying = false,
  loading = false,
}: PageStateProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex flex-1 items-center justify-center py-16">
        <section role="status" className="max-w-lg text-center">
          {loading ? (
            <LoaderCircle className="mx-auto mb-4 size-10 animate-spin text-muted-foreground" />
          ) : (
            <CircleAlert className="mx-auto mb-4 size-10 text-muted-foreground" />
          )}
          <h1 className="mb-3 text-2xl font-semibold">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className={buttonVariants()}>
              Back to events
            </Link>
            {onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                disabled={retrying}
                aria-busy={retrying}
              >
                {retrying ? "Retrying..." : "Try again"}
              </Button>
            )}
          </div>
        </section>
      </main>
      <Footer minimal />
    </div>
  )
}
