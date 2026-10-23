import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Users } from "lucide-react"

import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import {
  api,
  resolveApiAssetUrl,
  type AdminPhotographer,
  type PhotographerApprovalStatus,
} from "@/data/apiClient"
import { adminKeys, adminPhotographersQueryOptions } from "@/data/queries/admin"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { ModernDropdown } from "@/components/ModernDropdown"
import { SearchInput } from "@/components/SearchInput"
import { TitleHeader } from "@/components/TitleHeader"

const STATUS_BADGES: Record<
  PhotographerApprovalStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  // The API stores a rejected sign-up as "suspended"
  suspended: { label: "Rejected", variant: "destructive" },
}

const STRIPE_LABELS: Record<AdminPhotographer["stripe_status"], string> = {
  not_connected: "Not connected",
  action_needed: "Action needed",
  pending: "Verifying",
  active: "Connected",
}

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "suspended" },
]

/** Admin: review photographer sign-ups. Approval lives in our database only. */
export function Photographers() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const photographersQuery = useQuery({
    ...adminPhotographersQueryOptions(),
    enabled: user?.role === "admin",
  })
  const photographers = photographersQuery.data ?? null
  // Only when there is nothing to show (a failed refetch keeps the list)
  const loadError =
    photographersQuery.isError && !photographersQuery.data
      ? photographersQuery.error.message || "Could not load photographers."
      : null
  // First load only: a refetch keeps showing the list
  const isLoadingPhotographers = !photographers && !loadError
  const [status, setStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectTarget, setRejectTarget] = useState<AdminPhotographer | null>(
    null
  )

  const saveStatus = useMutation({
    mutationFn: ({
      photographer,
      next,
    }: {
      photographer: AdminPhotographer
      next: PhotographerApprovalStatus
    }) => api.setPhotographerStatus(photographer.id, next),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminPhotographer[]>(
        adminKeys.photographers(),
        (current) => current?.map((p) => (p.id === updated.id ? updated : p))
      )
    },
  })
  const savingId = saveStatus.isPending
    ? saveStatus.variables.photographer.id
    : null

  const setPhotographerStatus = async (
    photographer: AdminPhotographer,
    next: PhotographerApprovalStatus
  ) => {
    try {
      const updated = await saveStatus.mutateAsync({ photographer, next })
      notify(
        `${updated.display_name} is now ${STATUS_BADGES[next].label.toLowerCase()}`,
        "success"
      )
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Could not update the photographer",
        "error"
      )
    }
  }

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return (photographers ?? []).filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!query ||
          p.display_name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query.replace(/^@/, "")))
    )
  }, [photographers, searchQuery, status])

  const pendingCount =
    photographers?.filter((p) => p.status === "pending").length ?? 0

  return (
    <div className="pb-20">
      <TitleHeader variant="workspace" title="Photographers" />

      <div className="relative min-h-[calc(100vh-200px)] bg-background py-10">
        <div className="container">
          <FilterBar
            searchWidth="fixed"
            filters={
              <>
                <ModernDropdown
                  label="Status"
                  value={status}
                  options={statusOptions}
                  onChange={setStatus}
                  placeholder="Status"
                  variant="pill"
                />
                <ResetFiltersButton
                  disabled={status === "all" && searchQuery === ""}
                  onClick={() => {
                    setStatus("all")
                    setSearchQuery("")
                  }}
                />
              </>
            }
            search={
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search name, email or @handle"
              />
            }
            meta={
              <>
                Showing {filtered.length} photographers
                {pendingCount > 0 && ` · ${pendingCount} waiting for approval`}
              </>
            }
          />

          {loadError ? (
            <EmptyState
              icon={<Users />}
              title="Photographers could not be loaded"
              description={loadError}
            />
          ) : !isLoadingPhotographers && filtered.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={
                photographers?.length
                  ? "No results found"
                  : "No photographers yet"
              }
            />
          ) : (
            <div
              aria-busy={isLoadingPhotographers || undefined}
              className="overflow-hidden rounded-xl border bg-card"
            >
              {isLoadingPhotographers && (
                <span className="sr-only">Loading photographers…</span>
              )}
              {/* min width: on phones the fixed columns (670px) squeezed Name to 0 and cut off Actions; now it scrolls */}
              <Table className="min-w-4xl table-fixed">
                <TableHeader>
                  <TableRow className="bg-background hover:bg-background">
                    <TableHead className={headClass}>Name</TableHead>
                    <TableHead className={cn(headClass, "w-30")}>
                      Joined
                    </TableHead>
                    <TableHead className={cn(headClass, "w-22.5 text-right")}>
                      Photos
                    </TableHead>
                    <TableHead className={cn(headClass, "w-35")}>
                      Stripe
                    </TableHead>
                    <TableHead className={cn(headClass, "w-30")}>
                      Status
                    </TableHead>
                    <TableHead className={cn(headClass, "w-50 text-right")}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPhotographers &&
                    Array.from({ length: 6 }).map((_, index) => (
                      <PhotographerRowSkeleton key={index} />
                    ))}
                  {filtered.map((p) => {
                    const badge = STATUS_BADGES[p.status]
                    const isSaving = savingId === p.id
                    return (
                      <TableRow key={p.id} className="hover:bg-background">
                        <TableCell className={cellClass}>
                          <div className="flex items-center gap-3">
                            <Avatar size="lg">
                              <AvatarImage
                                src={
                                  resolveApiAssetUrl(p.avatar_url) ?? undefined
                                }
                                alt=""
                              />
                              <AvatarFallback>
                                {initials(p.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col gap-px">
                              <Link
                                to={`/photographer/${p.slug}`}
                                className="truncate text-sm font-semibold text-foreground hover:text-primary"
                              >
                                {p.display_name}
                              </Link>
                              {p.city && (
                                <div className="truncate text-[0.8125rem] text-muted-foreground">
                                  {p.city}
                                </div>
                              )}
                              <div className="truncate text-xs text-muted-foreground">
                                {/* Username sign-ups have no email: show their handle */}
                                {p.email || `@${p.slug}`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={cellClass}>
                          {new Date(p.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {p.photo_count}
                        </TableCell>
                        <TableCell
                          className={cn(cellClass, "text-muted-foreground")}
                        >
                          {STRIPE_LABELS[p.stripe_status]}
                        </TableCell>
                        <TableCell className={cellClass}>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {/* Approved: no actions. Rejected: Approve undoes a mistake */}
                          {p.status !== "approved" && (
                            <div className="flex justify-end gap-2">
                              {p.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isSaving}
                                  onClick={() => setRejectTarget(p)}
                                >
                                  Reject
                                </Button>
                              )}
                              <Button
                                size="sm"
                                disabled={isSaving}
                                onClick={() =>
                                  setPhotographerStatus(p, "approved")
                                }
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => {
          if (rejectTarget)
            void setPhotographerStatus(rejectTarget, "suspended")
          setRejectTarget(null)
        }}
        title="Reject photographer?"
        description={
          <>
            <strong>{rejectTarget?.display_name}</strong> won't get access to
            the studio: no bookings, uploads or edits. You can still approve
            them later.
          </>
        }
        confirmLabel="Reject"
      />
    </div>
  )
}

/** Loading placeholder shaped like a table row (name with city and email) */
function PhotographerRowSkeleton() {
  // Bars sit inline in text lines, so each line keeps its real height
  const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"

  return (
    <TableRow aria-hidden="true" className="hover:bg-background">
      <TableCell className={cellClass}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-col gap-px">
            <div className="text-sm">
              <Skeleton className={cn(bar, "w-36")} />
            </div>
            <div className="text-[0.8125rem]">
              <Skeleton className={cn(bar, "w-20")} />
            </div>
            <div className="text-xs">
              <Skeleton className={cn(bar, "w-44")} />
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className={cellClass}>
        <Skeleton className={cn(bar, "w-20")} />
      </TableCell>
      <TableCell className={cn(cellClass, "text-right")}>
        <Skeleton className={cn(bar, "w-6")} />
      </TableCell>
      <TableCell className={cellClass}>
        <Skeleton className={cn(bar, "w-24")} />
      </TableCell>
      <TableCell className={cellClass}>
        <Skeleton className="h-6 w-18 rounded-full" />
      </TableCell>
      <TableCell className={cn(cellClass, "text-right")}>
        <Skeleton className="ml-auto h-9 w-21 rounded-full" />
      </TableCell>
    </TableRow>
  )
}

const headClass =
  "h-auto px-3 py-2.5 text-[0.6875rem] font-bold tracking-[0.06em] text-muted-foreground uppercase"

const cellClass = "px-3 py-3.5 text-sm"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
