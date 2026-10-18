import { Fragment } from "react"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
  active?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null

  const lastIndex = items.length - 1

  return (
    <section className="bg-card py-3">
      <div className="container">
        <Breadcrumb>
          <BreadcrumbList className="max-md:flex-nowrap max-md:overflow-hidden">
            {items.map((item, index) => {
              const content = (
                <>
                  {index === 0 && <ChevronLeft className="size-3.5 shrink-0" />}
                  <span className="max-md:truncate">{item.label}</span>
                </>
              )

              return (
                <Fragment key={index}>
                  <BreadcrumbItemUI
                    className={cn(
                      // Mobile: keep the first item, let the rest truncate
                      index === 0 && "max-md:shrink-0",
                      index > 0 &&
                        index < lastIndex &&
                        "max-md:min-w-0 max-md:flex-[2_2_0%]",
                      index === lastIndex &&
                        index > 0 &&
                        "max-md:min-w-0 max-md:shrink"
                    )}
                  >
                    {item.active ? (
                      <BreadcrumbPage className="flex min-w-0 items-center gap-1">
                        {content}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<button type="button" onClick={item.onClick} />}
                        className="flex min-w-0 items-center gap-1"
                      >
                        {content}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItemUI>
                  {index < lastIndex && (
                    <BreadcrumbSeparator className="max-md:mx-1 max-md:shrink-0" />
                  )}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </section>
  )
}
