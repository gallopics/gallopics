import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-3 bg-[var(--color-surface)]">
      <div className="container">
        <nav
          className="flex items-center gap-2 m-0 flex-wrap max-[768px]:flex-nowrap max-[768px]:overflow-hidden max-[768px]:w-full"
          aria-label="Breadcrumb"
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <div
                className={[
                  'flex items-center gap-1',
                  'text-[var(--color-text-secondary)] text-[0.8125rem] font-medium',
                  'transition-all duration-200 ease-in-out',
                  item.onClick
                    ? 'cursor-pointer hover:text-[var(--color-text-primary)]'
                    : '',
                  item.active
                    ? 'text-[var(--color-text-primary)] cursor-default'
                    : '',
                  // Mobile shrink behavior
                  index === 0 ? 'max-[768px]:flex-shrink-0' : '',
                  index > 0 && index < items.length - 1
                    ? 'max-[768px]:flex-[2_2_0%] max-[768px]:min-w-0'
                    : '',
                  index === items.length - 1 && items.length > 1
                    ? 'max-[768px]:flex-shrink max-[768px]:min-w-0'
                    : '',
                ].join(' ')}
                onClick={item.onClick}
              >
                {index === 0 && (
                  <ChevronLeft size={14} className="flex-shrink-0" />
                )}
                <span className="max-[768px]:overflow-hidden max-[768px]:text-ellipsis max-[768px]:whitespace-nowrap max-[768px]:min-w-0 max-[768px]:block">
                  {item.label}
                </span>
              </div>
              {index < items.length - 1 && (
                <span className="text-[var(--color-border)] text-[0.75rem] font-normal max-[768px]:flex-shrink-0 max-[768px]:mx-1">
                  /
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>
  );
};
