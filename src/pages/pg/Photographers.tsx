import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router"
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { ModernDropdown } from "@/components/ModernDropdown"
import {
  ScopedSearchBar,
  type ScopedSearchOption,
} from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"

// Mock Data
// Mock Data - Robust Generation
const MOCK_PHOTOGRAPHERS = [
  {
    name: "Hanna Björk",
    city: "Stockholm",
    events: 4,
    revenue: 12500,
    published: 450,
    sold: 34,
    totalSold: 120,
    status: "available",
  },
  {
    name: "Klara Fors",
    city: "Gothenburg",
    events: 2,
    revenue: 5600,
    published: 200,
    sold: 15,
    totalSold: 40,
    status: "unavailable",
  },
  {
    name: "Ida Holmgren",
    city: "Malmö",
    events: 8,
    revenue: 24000,
    published: 890,
    sold: 78,
    totalSold: 200,
    status: "available",
  },
  {
    name: "Tove Lund",
    city: "Uppsala",
    events: 1,
    revenue: 1200,
    published: 50,
    sold: 3,
    totalSold: 10,
    status: "available",
  },
  {
    name: "Sara Engström",
    city: "Lund",
    events: 5,
    revenue: 15400,
    published: 600,
    sold: 45,
    totalSold: 150,
    status: "available",
  },
  {
    name: "Johan Lindahl",
    city: "Västerås",
    events: 3,
    revenue: 8900,
    published: 320,
    sold: 25,
    totalSold: 80,
    status: "unavailable",
  },
  {
    name: "Erik Nyberg",
    city: "Örebro",
    events: 2,
    revenue: 4500,
    published: 180,
    sold: 12,
    totalSold: 40,
    status: "available",
  },
  {
    name: "Mattias Berg",
    city: "Linköping",
    events: 6,
    revenue: 18200,
    published: 750,
    sold: 60,
    totalSold: 180,
    status: "available",
  },
  {
    name: "Daniel Söder",
    city: "Helsingborg",
    events: 1,
    revenue: 2800,
    published: 120,
    sold: 8,
    totalSold: 25,
    status: "available",
  },
  {
    name: "Per Hedman",
    city: "Jönköping",
    events: 3,
    revenue: 9500,
    published: 350,
    sold: 28,
    totalSold: 90,
    status: "unavailable",
  },
].map((p, i) => ({
  id: String(i + 1),
  ...p,
  email: `${p.name.toLowerCase().replace(" ", ".")}@gallopics.se`,
  // Use the convention from EventsList: Name + .jpg
  avatarUrl: "",
  subEvents: [
    {
      id: `e${i}-1`,
      name: `${p.city} Horse Show`,
      published: Math.floor(p.published * 0.6),
      sold: `${Math.floor(p.sold * 0.6)}/${Math.floor(p.totalSold * 0.6)}`,
      revenue: Math.floor(p.revenue * 0.6),
    },
    ...(p.events > 1
      ? [
          {
            id: `e${i}-2`,
            name: `Summer Cup ${p.city}`,
            published: Math.floor(p.published * 0.4),
            sold: `${Math.floor(p.sold * 0.4)}/${Math.floor(p.totalSold * 0.4)}`,
            revenue: Math.floor(p.revenue * 0.4),
          },
        ]
      : []),
  ],
}))

const CITY_COUNTY_MAP: Record<string, string> = {
  Stockholm: "stockholm",
  Gothenburg: "vastra-gotaland",
  Malmö: "skane",
  Uppsala: "uppsala",
  Lund: "skane",
  Västerås: "vastmanland",
  Örebro: "orebro",
  Linköping: "ostergotland",
  Helsingborg: "skane",
  Jönköping: "jonkoping",
}

export function Photographers() {
  // Filters
  const [country, setCountryFilter] = useState("sweden")
  const [county, setCounty] = useState("all")
  const [city, setCity] = useState("all")
  const [status, setStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  // Photographer waiting for delete confirmation (old: window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedRows(next)
  }

  // Derived data
  const filteredPhotographers = useMemo(() => {
    return MOCK_PHOTOGRAPHERS.map((p) => ({
      ...p,
      county: CITY_COUNTY_MAP[p.city] || "other",
    })).filter((p) => {
      const matchCounty = county === "all" || p.county === county
      const matchCity =
        city === "all" || p.city.toLowerCase() === city.toLowerCase()
      const matchStatus =
        status === "all" ||
        (status === "available" && p.status === "available") ||
        (status === "unavailable" && p.status === "unavailable")
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subEvents.some((e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

      return matchCounty && matchCity && matchStatus && matchSearch
    })
  }, [county, city, status, searchQuery])

  // Search options
  const searchOptions = useMemo<ScopedSearchOption[]>(() => {
    const pNames = MOCK_PHOTOGRAPHERS.map((p) => ({
      label: p.name,
      value: p.name,
      type: "rider" as const,
    }))
    const eNames = MOCK_PHOTOGRAPHERS.flatMap((p) => p.subEvents).map((e) => ({
      label: e.name,
      value: e.name,
      type: "horse" as const,
    }))
    return [...pNames, ...eNames]
  }, [])

  const isResetDisabled =
    city === "all" && status === "all" && county === "all" && searchQuery === ""

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
                  label="Country"
                  value={country}
                  options={[{ label: "Sweden", value: "sweden" }]}
                  onChange={setCountryFilter}
                  placeholder="Country"
                  variant="pill"
                />
                <ModernDropdown
                  label="County"
                  value={county}
                  options={[
                    { label: "Any county", value: "all" },
                    { label: "Stockholm", value: "stockholm" },
                    { label: "Västra Götaland", value: "vastra-gotaland" },
                    { label: "Skåne", value: "skane" },
                    { label: "Uppsala", value: "uppsala" },
                    { label: "Västmanland", value: "vastmanland" },
                    { label: "Örebro", value: "orebro" },
                    { label: "Östergötland", value: "ostergotland" },
                    { label: "Jönköping", value: "jonkoping" },
                  ]}
                  onChange={setCounty}
                  placeholder="County"
                  variant="pill"
                />
                <ModernDropdown
                  label="City"
                  value={city}
                  options={[
                    { label: "Any city", value: "all" },
                    { label: "Stockholm", value: "stockholm" },
                    { label: "Gothenburg", value: "gothenburg" },
                    { label: "Malmö", value: "malmö" },
                  ]}
                  onChange={setCity}
                  placeholder="City"
                  variant="pill"
                />
                <ModernDropdown
                  label="Status"
                  value={status}
                  options={[
                    { label: "Any status", value: "all" },
                    { label: "Available", value: "available" },
                    { label: "Unavailable", value: "unavailable" },
                  ]}
                  onChange={setStatus}
                  placeholder="Status"
                  variant="pill"
                />
                <ResetFiltersButton
                  disabled={isResetDisabled}
                  onClick={() => {
                    setCity("all")
                    setStatus("all")
                    setSearchQuery("")
                  }}
                />
              </>
            }
            search={
              <ScopedSearchBar
                currentValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSelect={setSearchQuery}
                placeholder="Search photographers or events"
                options={searchOptions}
              />
            }
            meta={<>Showing {filteredPhotographers.length} photographers</>}
          />

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-background hover:bg-background">
                  <TableHead className={cn(headClass, "w-10 pr-1 pl-2")} />
                  <TableHead className={headClass}>Name</TableHead>
                  <TableHead className={cn(headClass, "w-20 text-right")}>
                    Events
                  </TableHead>
                  <TableHead className={cn(headClass, "w-32.5 text-right")}>
                    Earnings (SEK)
                  </TableHead>
                  <TableHead className={cn(headClass, "w-25 text-right")}>
                    Published
                  </TableHead>
                  <TableHead className={cn(headClass, "w-22.5 text-right")}>
                    Sold
                  </TableHead>
                  <TableHead className={cn(headClass, "w-30")}>
                    Status
                  </TableHead>
                  <TableHead className={cn(headClass, "w-12 pr-2 pl-0")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhotographers.map((p) => {
                  const isExpanded = expandedRows.has(p.id)
                  return (
                    <Fragment key={p.id}>
                      <TableRow className="hover:bg-background">
                        <TableCell className="pr-1 pl-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={
                              isExpanded ? "Hide events" : "Show events"
                            }
                            aria-expanded={isExpanded}
                            onClick={() => toggleRow(p.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-5" />
                            ) : (
                              <ChevronRight className="size-5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className={cellClass}>
                          <div className="flex items-center gap-3">
                            <Avatar size="lg">
                              <AvatarImage src={p.avatarUrl} alt="" />
                              <AvatarFallback>
                                {initials(p.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col gap-px">
                              <Link
                                to={`/photographer/${p.id}`}
                                className="truncate text-sm font-semibold text-foreground hover:text-primary"
                              >
                                {p.name}
                              </Link>
                              <div className="text-[0.8125rem] text-muted-foreground">
                                {p.city}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {p.events}
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {p.revenue.toLocaleString().replace(/,/g, " ")}
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {p.published}
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {p.sold}/{p.totalSold}
                        </TableCell>
                        <TableCell className={cellClass}>
                          {p.status === "unavailable" ? (
                            <Badge variant="secondary">N/A</Badge>
                          ) : (
                            <Badge variant="success">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-2 pl-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete photographer"
                            aria-label="Delete photographer"
                            className="text-border hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(p.name)}
                          >
                            <Trash2 className="size-4.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-background hover:bg-background">
                          <TableCell colSpan={8} className="p-0">
                            <div className="border-t py-3 pr-4 pl-13">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b">
                                    <th className={subHeadClass}>Event Name</th>
                                    <th
                                      className={cn(subHeadClass, "text-right")}
                                    >
                                      Published
                                    </th>
                                    <th
                                      className={cn(subHeadClass, "text-right")}
                                    >
                                      Sold
                                    </th>
                                    <th
                                      className={cn(subHeadClass, "text-right")}
                                    >
                                      Earnings (SEK)
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                  {p.subEvents.map((e) => (
                                    <tr
                                      key={e.id}
                                      className="border-b text-[0.8125rem] *:px-2.5 *:py-2"
                                    >
                                      <td>
                                        <Link
                                          to="/admin/events/1"
                                          className="font-semibold text-foreground hover:text-primary"
                                        >
                                          {e.name}
                                        </Link>
                                      </td>
                                      <td className="text-right">
                                        {e.published}
                                      </td>
                                      <td className="text-right">{e.sold}</td>
                                      <td className="text-right">
                                        {e.revenue
                                          .toLocaleString()
                                          .replace(/,/g, " ")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          // Mock action, as in the old app
          console.log("Deleted", deleteTarget)
          setDeleteTarget(null)
        }}
        title="Delete photographer?"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget}</strong>?
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  )
}

const headClass =
  "h-auto px-3 py-2.5 text-[0.6875rem] font-bold tracking-[0.06em] text-muted-foreground uppercase"

const subHeadClass =
  "px-2.5 py-1.5 text-left text-[0.6875rem] font-bold tracking-[0.06em] text-muted-foreground uppercase"

const cellClass = "px-3 py-3.5 text-sm"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}
