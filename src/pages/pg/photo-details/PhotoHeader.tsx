import { Clock } from "lucide-react"

import { shortPhotoId } from "@/lib/shortPhotoId"
import type { Photo } from "@/context/PhotographerContext"

export function PhotoHeader({ photo }: { photo: Photo }) {
  return (
    <div className="mb-4 flex items-start gap-4">
      <img
        src={photo.url}
        alt=""
        className="size-20 rounded-lg bg-muted object-cover"
      />
      <div className="min-w-0 flex-1">
        <div
          className="mb-1 truncate text-sm font-semibold text-foreground"
          title={photo.fileName}
        >
          {photo.fileName}
        </div>
        {/* The same code as on the Sales page */}
        <div className="mb-2 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          {shortPhotoId(photo.id)}
        </div>
        <div className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
          <Clock className="size-3.5" />
          <span>
            {photo.uploadDate &&
              `${new Date(photo.uploadDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })} • `}
            {photo.timestamp}
          </span>
        </div>
      </div>
    </div>
  )
}
