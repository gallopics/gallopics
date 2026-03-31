import React from 'react';

interface MasonryGridProps {
  children: React.ReactNode;
  isLoading?: boolean;
  skeletonCount?: number;
  renderSkeleton?: () => React.ReactNode;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  isLoading = false,
  skeletonCount = 12,
  renderSkeleton,
}) => {
  if (isLoading && renderSkeleton) {
    return (
      <div className="[column-gap:var(--grid-gap)] pb-[var(--spacing-xl)] w-full will-change-auto columns-2 max-[480px]:columns-2 max-[480px]:[column-gap:12px] min-[481px]:columns-3 max-[768px]:min-[481px]:columns-3 min-[769px]:columns-4 max-[1024px]:min-[769px]:columns-4 min-[1025px]:columns-5 min-[1441px]:columns-6">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <React.Fragment key={`skel-${index}`}>
            {renderSkeleton()}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="[column-gap:var(--grid-gap)] pb-[var(--spacing-xl)] w-full will-change-auto columns-2 max-[480px]:columns-2 max-[480px]:[column-gap:12px] min-[481px]:columns-3 max-[768px]:min-[481px]:columns-3 min-[769px]:columns-4 max-[1024px]:min-[769px]:columns-4 min-[1025px]:columns-5 min-[1441px]:columns-6">
      {children}
    </div>
  );
};
