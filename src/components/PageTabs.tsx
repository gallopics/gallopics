import React from 'react';

interface TabItem {
  id: string;
  label: string;
}

interface PageTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const PageTabs: React.FC<PageTabsProps> = ({
  tabs,
  activeTab,
  onChange,
}) => {
  return (
    <div
      className={[
        'flex gap-6 border-b border-[var(--color-border)] w-full',
        'overflow-x-auto flex-nowrap',
        '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
        '[-webkit-overflow-scrolling:touch]',
      ].join(' ')}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={[
            'px-1 py-3 text-base font-medium cursor-pointer transition-all duration-200',
            'bg-none border-none border-b-2 whitespace-nowrap',
            activeTab === tab.id
              ? 'text-[var(--color-brand-primary)] border-b-[var(--color-brand-primary)] font-semibold border-b-2'
              : 'text-[var(--color-text-secondary)] border-b-transparent hover:text-[var(--color-text-primary)]',
          ].join(' ')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
