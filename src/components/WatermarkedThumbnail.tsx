import { cn } from "@/lib/utils"

type WatermarkedThumbnailProps = React.ImgHTMLAttributes<HTMLImageElement>

const PREVIEW_WATERMARK_TEXT =
  "This image is a preview and may not be used or published without purchase"

/** Photo thumbnail with the "preview" watermark line at the bottom. */
export function WatermarkedThumbnail({
  className,
  alt,
  ...props
}: WatermarkedThumbnailProps) {
  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      <img className="block size-full object-cover" alt={alt} {...props} />
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-2 flex w-full -translate-x-1/2 flex-col items-center justify-center opacity-40">
        <span className="max-w-[82%] text-center text-[0.7rem] leading-[1.25] font-semibold tracking-[0.02em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
          {PREVIEW_WATERMARK_TEXT}
        </span>
      </div>
    </div>
  )
}
