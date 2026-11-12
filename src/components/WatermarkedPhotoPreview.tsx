import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type WatermarkedPhotoPreviewProps = React.ImgHTMLAttributes<HTMLImageElement>

/** Keep the notice inside the image, including letterboxed previews. */
export function WatermarkedPhotoPreview({
  className,
  alt,
  ...props
}: WatermarkedPhotoPreviewProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const img = imageRef.current
    if (!img) return
    const measure = () => {
      if (!img.naturalWidth || !img.naturalHeight) return
      const scale = Math.min(
        img.clientWidth / img.naturalWidth,
        img.clientHeight / img.naturalHeight
      )
      setImageSize({
        width: img.naturalWidth * scale,
        height: img.naturalHeight * scale,
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(img)
    img.addEventListener("load", measure)
    return () => {
      observer.disconnect()
      img.removeEventListener("load", measure)
    }
  }, [])

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden bg-muted",
        className
      )}
    >
      <img
        ref={imageRef}
        className="block max-h-full max-w-full object-contain"
        alt={alt}
        {...props}
      />
      <div
        data-preview-image-box
        className="[container-type:inline-size] pointer-events-none absolute top-1/2 left-1/2 z-11 -translate-1/2"
        style={{
          ...imageSize,
          visibility: imageSize.width ? "visible" : "hidden",
        }}
      >
        <span className="absolute inset-x-[4%] bottom-[5%] text-center text-[clamp(8px,3cqw,16px)] leading-[1.35] font-semibold wrap-anywhere text-white opacity-60 [text-shadow:0_2px_4px_rgba(0,0,0,0.65)]">
          This image is a preview and may not be used or published without
          purchase
        </span>
      </div>
    </div>
  )
}
