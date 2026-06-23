import React from 'react';

interface WatermarkedPhotoPreviewProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photographer?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const WatermarkedPhotoPreview: React.FC<
  WatermarkedPhotoPreviewProps
> = ({ onLoad, className, alt, photographer, ...props }) => {
  return (
    <div
      className={`relative w-full h-full flex justify-center items-center bg-[var(--ui-bg-subtle)] overflow-hidden ${className || ''}`}
    >
      <img
        className="max-w-full max-h-full object-contain block"
        alt={alt}
        onLoad={onLoad}
        {...props}
      />
      {/* Center Standard Mark */}
      <div
        className={[
          'absolute bottom-6 left-1/2 -translate-x-1/2',
          'z-[11] pointer-events-none flex max-w-[80%] max-md:max-w-[94%] items-center justify-center opacity-60',
        ].join(' ')}
      >
        <span className="text-center text-white text-[1rem] max-md:text-[0.68rem] font-semibold leading-[1.35] [text-shadow:0_2px_4px_rgba(0,0,0,0.65)]">
          <span className="max-md:block max-md:whitespace-nowrap">
            This image is a preview and may not
          </span>
          <span className="max-md:hidden"> </span>
          <span className="max-md:block max-md:whitespace-nowrap">
            be used or published without purchase
          </span>
        </span>
      </div>
    </div>
  );
};
