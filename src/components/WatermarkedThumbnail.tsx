import React from 'react';

interface WatermarkedThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photographer?: string;
}

const PREVIEW_WATERMARK_TEXT =
  'This image is a preview and may not be used or published without purchase';

export const WatermarkedThumbnail: React.FC<WatermarkedThumbnailProps> = ({
  className,
  alt,
  ...props
}) => {
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className || ''}`}
    >
      <img className="w-full h-full object-cover block" alt={alt} {...props} />
      <div
        className={[
          'absolute bottom-3 left-1/2 -translate-x-1/2',
          'flex flex-col items-center justify-center',
          'pointer-events-none z-[2] opacity-40 w-full',
        ].join(' ')}
      >
        <span
          className={[
            'max-w-[82%] text-white text-[0.7rem] font-semibold leading-[1.25] text-center',
            'shadow-[0_1px_2px_rgba(0,0,0,0.65)] tracking-[0.02em]',
          ].join(' ')}
        >
          {PREVIEW_WATERMARK_TEXT}
        </span>
      </div>
    </div>
  );
};
