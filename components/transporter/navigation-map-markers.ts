/**
 * Marker HTML shared by the Mapbox and Leaflet navigator maps.
 *
 * Both libraries accept a raw HTML string for custom markers, so the label has
 * to be escaped here rather than relying on React.
 */

export function pinMarkup(kind: "pickup" | "dropoff", label: string): string {
  const color = kind === "pickup" ? "#0284c7" : "#7c3aed"
  const icon =
    kind === "pickup"
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>'
  return (
    `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(15,23,42,.28));">` +
    `<div style="width:34px;height:34px;border-radius:17px;border:3px solid #fff;background:${color};display:flex;align-items:center;justify-content:center;">${icon}</div>` +
    `<div style="width:3px;height:8px;border-radius:2px;background:${color};"></div>` +
    `<div style="margin-top:3px;max-width:130px;padding:2px 7px;border-radius:7px;background:rgba(15,23,42,.86);color:#fff;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(label)}</div>` +
    `</div>`
  )
}

export function driverMarkup(withPackage: boolean): string {
  const badge = withPackage
    ? '<div data-package-badge="true" style="position:absolute;right:-4px;top:-4px;width:16px;height:16px;border-radius:8px;background:#16a34a;border:2px solid #fff;"></div>'
    : ""
  return (
    `<div data-driver-disc="true" style="position:relative;width:38px;height:38px;border-radius:19px;background:#1a56db;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(15,23,42,.35);">` +
    `<div data-driver-arrow="true" style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:17px solid #fff;transition:transform 240ms linear;"></div>` +
    badge +
    `</div>`
  )
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}
