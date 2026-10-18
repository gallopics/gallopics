import { Download } from "lucide-react"

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
import { TitleHeader } from "@/components/TitleHeader"
import {
  WorkspaceCard,
  WorkspacePageBody,
} from "@/components/WorkspacePageBody"

// Mock data, as in the old app
const mockReceipts = [
  {
    id: "REC-001",
    date: "2026-01-15",
    amount: "€1,250.00",
    status: "Paid",
    description: "Payout for Dec 2025",
  },
  {
    id: "REC-002",
    date: "2025-12-15",
    amount: "€850.00",
    status: "Paid",
    description: "Payout for Nov 2025",
  },
  {
    id: "REC-003",
    date: "2025-11-15",
    amount: "€2,100.00",
    status: "Paid",
    description: "Payout for Oct 2025",
  },
]

const headClass =
  "h-auto bg-card px-5 py-3.5 font-medium tracking-wide normal-case"

export function Receipts() {
  return (
    <div className="w-full">
      <TitleHeader
        variant="workspace"
        title="Receipts"
        subtitle="Download and manage your payout receipts and invoices."
      />

      <WorkspacePageBody>
        <WorkspaceCard className="overflow-hidden p-0">
          <Table>
            <TableHeader className="[&_tr]:border-muted">
              <TableRow className="hover:bg-transparent">
                {["ID", "Date", "Description", "Amount", "Status"].map(
                  (label) => (
                    <TableHead key={label} className={`${headClass} uppercase`}>
                      {label}
                    </TableHead>
                  )
                )}
                <TableHead className={`${headClass} text-right uppercase`}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReceipts.map((receipt) => (
                <TableRow
                  key={receipt.id}
                  className="border-muted hover:bg-transparent"
                >
                  <TableCell className="px-5 py-4 font-medium text-muted-foreground">
                    {receipt.id}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">
                    {receipt.date}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {receipt.description}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-semibold">
                    {receipt.amount}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge variant="success" className="font-medium">
                      {receipt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium hover:no-underline hover:opacity-75"
                    >
                      <Download className="size-3.75" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorkspaceCard>

        <WorkspaceCard>
          <h2 className="mb-1.5 text-lg font-semibold text-foreground">
            Payout Details
          </h2>
          <p className="mb-3 text-sm leading-[1.6] text-muted-foreground">
            Payouts are processed automatically on the 15th of every month for
            the previous month&apos;s sales.
          </p>
          <Button
            variant="outline"
            size="md"
            className="mt-2 text-muted-foreground"
          >
            Update payout method
          </Button>
        </WorkspaceCard>
      </WorkspacePageBody>
    </div>
  )
}
