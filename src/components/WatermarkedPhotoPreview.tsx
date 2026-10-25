import { cn } from "@/lib/utils"

type WatermarkedPhotoPreviewProps = React.ImgHTMLAttributes<HTMLImageElement>

/**
 * Full-size photo preview with the "preview" notice at the bottom.
 * (develop removed the repeating logo pattern; on mobile the notice is two lines)
 */
export function WatermarkedPhotoPreview({
  className,
  alt,
  ...props
}: WatermarkedPhotoPreviewProps) {
  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden bg-muted",
        className
      )}
    >
      <img
        className="block max-h-full max-w-full object-contain"
        alt={alt}
        {...props}
      />
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-11 flex max-w-[80%] -translate-x-1/2 items-center justify-center opacity-60 max-md:max-w-[94%]">
        <span className="text-center text-base leading-[1.35] font-semibold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.65)] max-md:text-[0.68rem]">
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
  )
}
