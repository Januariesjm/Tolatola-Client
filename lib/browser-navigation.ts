/**
 * Full-page navigation away from the app.
 *
 * Distinct from `router.push`, which moves between routes this app owns. This
 * hands the browser to a third party -- currently ClickPesa's hosted card page
 * -- and the app does not come back except via a fresh load.
 *
 * It is a named function rather than an inline `window.location.href =` so the
 * hand-off is greppable and so tests can observe it: jsdom's `window.location`
 * is non-configurable and cannot be swapped out.
 */
export function navigateToExternalUrl(url: string): void {
  window.location.href = url
}
