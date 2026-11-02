import { useMediaQuery } from "@/hooks/useMediaQuery"

const MOBILE_BREAKPOINT = 768

/** Used by the shadcn Sidebar; shares the project's media-query hook. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
