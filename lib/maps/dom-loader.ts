/**
 * Small idempotent loaders for third-party map libraries.
 *
 * Both are safe to call more than once (several navigator mounts, React strict
 * mode) and resolve immediately when the tag is already in the document, so a
 * remount does not fetch or execute mapbox-gl twice.
 */

export function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve()
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve()
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true"
        resolve()
      },
      { once: true },
    )
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true })
    document.head.appendChild(script)
  })
}

export function loadStylesheet(href: string, id: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve()
    if (document.getElementById(id)) return resolve()
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = href
    link.addEventListener("load", () => resolve(), { once: true })
    link.addEventListener("error", () => resolve(), { once: true })
    document.head.appendChild(link)
  })
}
