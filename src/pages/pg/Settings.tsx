import { useState } from "react"
import { Link } from "react-router"
import { useMutation, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/context/AuthContext"
import { usePhotographer } from "@/context/PhotographerContext"
import {
  highlightsQueryOptions,
  saveHighlightsMutationOptions,
} from "@/data/queries/photographer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ManageHighlightsModal } from "@/components/ManageHighlightsModal"
import { TitleHeader } from "@/components/TitleHeader"
import {
  WorkspaceCard,
  WorkspacePageBody,
} from "@/components/WorkspacePageBody"

function SettingRow({
  title,
  description,
  control,
  last,
}: {
  title: string
  description: React.ReactNode
  control: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-4 ${last ? "" : "border-b"}`}
    >
      <div className="flex-1 pr-6">
        <div className="mb-1 text-sm font-medium text-foreground">{title}</div>
        <div className="text-[0.8125rem] text-muted-foreground">
          {description}
        </div>
      </div>
      {control}
    </div>
  )
}

const NO_IDS: string[] = []

export function Settings() {
  const { isPhotographer } = useAuth()
  const highlightsQuery = useQuery({
    ...highlightsQueryOptions(),
    enabled: isPhotographer,
  })
  const highlights = highlightsQuery.data ?? NO_IDS
  const saveHighlights = useMutation(saveHighlightsMutationOptions())
  const { availableToHire, toggleAvailableToHire, photographerId } =
    usePhotographer()
  const [isHighlightsModalOpen, setIsHighlightsModalOpen] = useState(false)

  return (
    <div className="w-full">
      <TitleHeader
        variant="workspace"
        title="Settings"
        rightContent={
          <Button
            variant="outline"
            className="text-muted-foreground"
            size="md"
            nativeButton={false}
            render={
              <Link to={`/photographer/${photographerId}`} target="_blank" />
            }
          >
            Visit my public profile
          </Button>
        }
      />

      <WorkspacePageBody>
        <WorkspaceCard>
          <h2 className="mb-5 border-b pb-4 text-[1.1rem] font-semibold text-foreground">
            Profile & public page
          </h2>

          <SettingRow
            title="Highlight photos"
            description={`${highlights.length} / 10 selected`}
            control={
              <Button
                variant="outline"
                className="text-muted-foreground"
                size="md"
                // Saving before they load would replace them with nothing
                disabled={highlightsQuery.isPending}
                onClick={() => setIsHighlightsModalOpen(true)}
              >
                Manage
              </Button>
            }
          />
          <SettingRow
            last
            title="Available to hire"
            description="Allow potential clients to hire you from your public profile"
            control={
              <Switch
                aria-label="Available to hire"
                checked={availableToHire}
                onCheckedChange={(checked) => toggleAvailableToHire(checked)}
              />
            }
          />
        </WorkspaceCard>

        <ManageHighlightsModal
          isOpen={isHighlightsModalOpen}
          onClose={() => setIsHighlightsModalOpen(false)}
          initialIds={highlights}
          onSave={(ids) => saveHighlights.mutate(ids)}
        />
      </WorkspacePageBody>
    </div>
  )
}
