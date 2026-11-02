import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TabItem {
  id: string
  label: string
}

interface PageTabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function PageTabs({ tabs, activeTab, onChange }: PageTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onChange(String(value))}>
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
