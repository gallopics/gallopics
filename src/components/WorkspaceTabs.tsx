import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WorkspaceTabsProps<T extends string> {
  tabs: { value: T; label: React.ReactNode }[]
  value: T
  onChange: (value: T) => void
  /** Extra classes for each tab button */
  triggerClassName?: string
}

/** Underline tabs used in workspace page headers (old `.pg-tab-btn`). */
export function WorkspaceTabs<T extends string>({
  tabs,
  value,
  onChange,
  triggerClassName,
}: WorkspaceTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
      <TabsList variant="line" className="items-end gap-8 border-b-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              // old .pg-tab-btn: 48px tall (full header row), text centred above 12px bottom padding
              "group-data-[variant=line]/tabs-list:h-12 group-data-[variant=line]/tabs-list:px-1 group-data-[variant=line]/tabs-list:pt-0 group-data-[variant=line]/tabs-list:pb-3 group-data-[variant=line]/tabs-list:text-sm group-data-[variant=line]/tabs-list:font-semibold",
              triggerClassName
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
