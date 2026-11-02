import { Camera, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HorseIcon } from "@/components/icons/HorseIcon"
import { RiderIcon } from "@/components/icons/RiderIcon"

export interface ProfileAvatarProps {
  variant?: "rider" | "horse" | "photographer" | "default"
  url?: string
  name?: string
  size?: number
  className?: string
}

const fallbackClasses: Record<string, string> = {
  rider: "bg-[#7c3aed]/15 text-[#7c3aed]",
  horse: "bg-[#ea580c]/15 text-[#ea580c]",
  photographer: "bg-muted text-muted-foreground",
  default: "bg-muted text-muted-foreground",
}

function FallbackIcon({
  variant,
  size,
}: {
  variant: ProfileAvatarProps["variant"]
  size: number
}) {
  switch (variant) {
    case "rider":
      return <RiderIcon size={size * 0.65} />
    case "horse":
      return <HorseIcon size={size * 0.65} />
    case "photographer":
      return <Camera size={size * 0.6} />
    default:
      return <User size={size * 0.6} />
  }
}

export function ProfileAvatar({
  variant = "default",
  url,
  name,
  size = 40,
  className,
}: ProfileAvatarProps) {
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {url && <AvatarImage src={url} alt={name ?? ""} />}
      <AvatarFallback
        className={fallbackClasses[variant] ?? fallbackClasses.default}
      >
        <FallbackIcon variant={variant} size={size} />
      </AvatarFallback>
    </Avatar>
  )
}
