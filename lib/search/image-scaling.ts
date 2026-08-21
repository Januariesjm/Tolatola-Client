/**
 * Dimension maths for the visual product search.
 *
 * Extracted from compressImageForSearch in
 * components/layout/product-search.tsx. A photo taken on a phone is several
 * megabytes; it is downscaled and re-encoded before being put in
 * sessionStorage, because sessionStorage caps out around 5MB and a full-size
 * capture silently fails to store on some browsers.
 *
 * The maths is separated from the canvas work so it can be tested -- jsdom
 * implements no canvas, so the encoding half is not reachable in a unit test,
 * but the aspect-ratio arithmetic is where an off-by-one distorts every
 * uploaded photo.
 */

/** Longest edge, in pixels, that a search image is reduced to. */
export const SEARCH_IMAGE_MAX_DIMENSION = 800

/** JPEG quality used for the re-encode. */
export const SEARCH_IMAGE_QUALITY = 0.8

export interface Dimensions {
  width: number
  height: number
}

/**
 * Scales `width` x `height` down so its longest edge is at most `maxDim`,
 * preserving aspect ratio.
 *
 * An image already within the limit is returned unchanged rather than upscaled:
 * enlarging a small photo would add bytes without adding detail.
 *
 * The scaled edge is rounded, so a result can be a pixel off the exact ratio --
 * that is unavoidable with integer pixel dimensions, and imperceptible.
 */
export function scaleToFit(width: number, height: number, maxDim: number = SEARCH_IMAGE_MAX_DIMENSION): Dimensions {
  if (width <= maxDim && height <= maxDim) {
    return { width, height }
  }

  if (width > height) {
    return { width: maxDim, height: Math.round((height * maxDim) / width) }
  }

  // Equal sides land here too, which is correct: a square scales to maxDim x maxDim.
  return { width: Math.round((width * maxDim) / height), height: maxDim }
}
