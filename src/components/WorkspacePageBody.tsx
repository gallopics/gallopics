import { cn } from "@/lib/utils"

/** Grey content area under a workspace TitleHeader (old `.pg-page-body`). */
export function WorkspacePageBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "w-full bg-background px-4 pt-10 pb-16 max-[430px]:pt-4 max-md:pt-6",
        className
      )}
    >
      {children}
    </div>
  )
}

/** White 800px card used on the simple workspace pages */
export function WorkspaceCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto mb-6 max-w-200 rounded-xl border bg-card p-6",
        className
      )}
    >
      {children}
    </div>
  )
}
