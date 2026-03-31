import React from 'react';
import { assetUrl } from '../lib/utils';

interface WatermarkedThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photographer?: string;
}

export const WatermarkedThumbnail: React.FC<WatermarkedThumbnailProps> = ({
  photographer = 'Gallopics',
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
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'flex flex-col items-center justify-center',
          'pointer-events-none z-[2] opacity-40 w-full',
        ].join(' ')}
      >
        <img
          src={assetUrl('images/logo1.svg')}
          alt=""
          className="w-[45%] max-w-[100px] h-auto brightness-0 invert mb-[6px]"
        />
        <span
          className={[
            'text-white text-[0.75rem] font-medium text-center',
            'shadow-[0_1px_2px_rgba(0,0,0,0.5)] whitespace-nowrap tracking-[0.02em]',
          ].join(' ')}
        >
          © {photographer}
        </span>
      </div>
    </div>
  );
};
