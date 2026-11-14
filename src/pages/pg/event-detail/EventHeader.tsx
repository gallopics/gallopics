import { Link, useLocation } from "react-router"
import { ArrowLeft, Info, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PgEvent } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { Button, buttonVariants } from "@/components/ui/button"
import { ActionCluster } from "@/components/HeaderActions"
import { TitleHeader } from "@/components/TitleHeader"
import { WorkspaceTabs } from "@/components/WorkspaceTabs"

/** Title with back and info buttons, the public page link and the published count */
export function EventHeader({
  event,
  publishedCount,
  onInfo,
}: {
  event: PgEvent
  publishedCount: number
  onInfo: () => void
}) {
  const { basePath } = useWorkspace()
  const location = useLocation()
  // The Events tab to go back to
  const fromTab = (location.state as { fromTab?: string } | null)?.fromTab
  return (
    <TitleHeader
      compact
      variant="workspace"
      className="border-b-0"
      title={
        <div className="flex items-center gap-2">
          <Link
            to={`${basePath}/events`}
            state={{ tab: fromTab }}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "size-6.5"
            )}
            title="Back to events"
            aria-label="Back to events"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          {event.title}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6.5"
            onClick={onInfo}
            aria-label="Event details"
          >
            <Info className="size-4.5" />
          </Button>
        </div>
      }
      // Indented past the back button, so the date lines up with the title
      topSubtitle={<span className="pl-8.5">{event.dateRange}</span>}
      avatar={event.logo}
      avatarShape="square"
      rightContent={
        <ActionCluster>
          {basePath === "/pg" && (
            <Link
              to={`/event/${event.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              View public page
            </Link>
          )}
          <div className="flex flex-col items-start rounded-xl bg-muted px-4 py-2 whitespace-nowrap text-muted-foreground">
            <span className="text-[0.6875rem] leading-[1.2] font-semibold opacity-80">
              Published
            </span>
            <span className="text-sm leading-[1.2] font-bold text-foreground">
              {publishedCount}
            </span>
          </div>
        </ActionCluster>
      }
    />
  )
}

/** The Uploads tab with its count, and the Upload button */
export function UploadsTabRow({
  count,
  canUpload,
  onUpload,
}: {
  count: number
  canUpload: boolean
  onUpload: () => void
}) {
  return (
    <div className="border-b bg-card/95 backdrop-blur-sm">
      <div className="container flex items-center">
        <WorkspaceTabs
          // old .tab-btn: 14px 24px padding, 14px/21px, 2px underline overlapping the row border
          triggerClassName="-mb-px group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:px-6 group-data-[variant=line]/tabs-list:pt-3.5 group-data-[variant=line]/tabs-list:pb-4 group-data-[variant=line]/tabs-list:leading-normal"
          tabs={[
            {
              value: "uploads",
              label: (
                <>
                  Uploads
                  <span className="inline-flex h-4.5 min-w-5 items-center justify-center rounded-full border border-transparent bg-background px-1.5 text-xs font-bold text-muted-foreground in-data-active:border-primary/20 in-data-active:bg-primary/10 in-data-active:text-primary">
                    {count}
                  </span>
                </>
              ),
            },
          ]}
          value="uploads"
          onChange={() => undefined}
        />

        {/* Brand pill at the old 36px height; hidden when the booking was cancelled */}
        {canUpload && (
          <Button size="sm" className="ml-auto text-sm" onClick={onUpload}>
            <UploadCloud />
            Upload
          </Button>
        )}
      </div>
    </div>
  )
}
