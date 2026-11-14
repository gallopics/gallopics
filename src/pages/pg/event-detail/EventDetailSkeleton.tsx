import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { ActionCluster } from "@/components/HeaderActions"
import { PhotoCardSkeleton } from "@/components/PhotoCard"
import { TitleHeader } from "@/components/TitleHeader"

import { photoGridClass } from "./PhotoGrid"

/** First load: compact header, tabs row and photo cards as placeholders */
export function EventDetailSkeleton({ withLogo }: { withLogo: boolean }) {
  // Bars sit inline in text lines, so each line keeps its real height
  const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"

  return (
    <div aria-busy="true">
      <TitleHeader
        compact
        variant="workspace"
        className="border-b-0"
        title={
          <div aria-hidden="true" className="flex items-center gap-2">
            {/* Back and info buttons */}
            <Skeleton className="size-6.5 rounded-full" />
            <Skeleton className="h-[0.8em] w-48 rounded-sm bg-border" />
            <Skeleton className="size-6.5 rounded-full" />
          </div>
        }
        topSubtitle={
          <>
            <span className="sr-only">Loading event…</span>
            <Skeleton aria-hidden="true" className={cn(bar, "ml-8.5 w-24")} />
          </>
        }
        avatar={
          withLogo ? (
            <Skeleton aria-hidden="true" className="size-full rounded-md" />
          ) : undefined
        }
        avatarShape="square"
        rightContent={
          <ActionCluster>
            {/* "Published" count */}
            <Skeleton aria-hidden="true" className="h-11.5 w-21" />
          </ActionCluster>
        }
      />

      <div aria-hidden="true" className="border-b bg-card/95">
        <div className="container flex items-center">
          <div className="-mb-px px-6 pt-3.5 pb-4 text-sm leading-normal">
            <Skeleton className={cn(bar, "w-20")} />
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="container pt-6">
        <div className={photoGridClass}>
          {Array.from({ length: 8 }).map((_, index) => (
            <PhotoCardSkeleton key={index} pg />
          ))}
        </div>
      </div>
    </div>
  )
}
