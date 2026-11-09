import { useLocation } from "react-router"
import { SITE_URL } from "@/seo/seoTexts"

// React 19 adds these tags next to index.html's static ones, so remove those first.
// index.html has no static canonical: it would point every URL at the home page.
document.head
  .querySelectorAll("[data-page-meta]")
  .forEach((tag) => tag.remove())

/**
 * Title, description, share tags and canonical link (React 19 hoists them
 * into <head>). Render one per page; React removes them when the page leaves.
 */
export function PageMeta({
  title,
  description,
  noindex = false,
  canonicalPath,
}: {
  /** Includes the "| Gallopics" suffix. */
  title: string
  /** Left out on pages without SEO texts. */
  description?: string
  /** Keeps the page out of search results. */
  noindex?: boolean
  /** Overrides the current path, for pages reachable under several URLs. */
  canonicalPath?: string
}) {
  const { pathname } = useLocation()

  if (noindex) {
    return (
      <>
        <title>{title}</title>
        <meta name="robots" content="noindex" />
      </>
    )
  }

  // Without query parameters; no trailing slash, except on "/"
  const path = canonicalPath ?? pathname
  const url = SITE_URL + (path.replace(/\/+$/, "") || "/")

  return (
    <>
      <title>{title}</title>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      {description && (
        <>
          <meta name="description" content={description} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
        </>
      )}
    </>
  )
}
