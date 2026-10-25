import { useState } from "react"
import { MoreHorizontal, Share2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* Round action buttons shown at the right of page title headers. */

const actionButtonClass =
  "shadow-none hover:scale-105 hover:border-border hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] active:scale-[0.96] aria-expanded:border-border"

/** Round outlined icon button used in title headers (share, socials, …) */
export function ActionIconButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(actionButtonClass, className)}
      {...props}
    />
  )
}

export interface ActionItem {
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
}

export function MoreMenu({ actions }: { actions: ActionItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            title="More actions"
            className={actionButtonClass}
          />
        }
      >
        <MoreHorizontal className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            variant={action.variant}
            onClick={action.onClick}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Copies the page link and confirms with a small "Link copied" bubble. */
export function ShareIconButton({
  url,
  className,
}: {
  url?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(url || window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Tooltip open={copied}>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            title="Share"
            aria-label="Share page"
            className={cn(actionButtonClass, className)}
            onClick={handleShare}
          />
        }
      >
        <Share2 className="size-5" />
      </TooltipTrigger>
      <TooltipContent side="bottom">Link copied</TooltipContent>
    </Tooltip>
  )
}

export function ActionSeparator() {
  return (
    <Separator
      orientation="vertical"
      className="mx-1 h-6 data-vertical:self-center"
    />
  )
}

export function ActionCluster({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>
}
