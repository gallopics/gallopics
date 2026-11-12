import { cn } from "@/lib/utils"

type WatermarkedPhotoPreviewProps = React.ImgHTMLAttributes<HTMLImageElement>

/**
 * Full-size photo preview with the "preview" notice on the photo itself.
 * The frame is a size container, so the photo fits it (100cqw × 100cqh) inside
 * a wrapper that shrinks to the photo; the notice sits in that wrapper.
 */
export function WatermarkedPhotoPreview({
  className,
  alt,
  ...props
}: WatermarkedPhotoPreviewProps) {
  return (
    <div
      className={cn(
        "[container-type:size] relative flex size-full items-center justify-center overflow-hidden bg-muted",
        className
      )}
    >
      <div className="relative">
        <img
          className="block max-h-[100cqh] max-w-[100cqw] object-contain"
          alt={alt}
          {...props}
        />
        <span className="pointer-events-none absolute inset-x-[4%] bottom-[5%] z-11 text-center text-[clamp(10px,2.2cqmin,15px)] leading-[1.35] font-semibold wrap-anywhere text-white opacity-60 [text-shadow:0_2px_4px_rgba(0,0,0,0.65)]">
          This image is a preview and may not be used or published without
          purchase
        </span>
      </div>
    </div>
  )
}
