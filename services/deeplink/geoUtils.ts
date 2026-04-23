import { Geocache } from '../../types';

/**
 * Estimate an appropriate map zoom level based on the bounding box
 * of a set of geocaches.
 *
 * The approach maps the larger of latSpan / lngSpan to a zoom level so that
 * all points fit comfortably inside a typical viewport.
 *
 * @param caches  - Array of caches (must have .latitude / .longitude)
 * @param fallback - Zoom level to use when only one point is present (default 16)
 */
export function zoomForCaches(caches: Geocache[], fallback = 16): number {
  if (caches.length <= 1) return fallback;

  const lats = caches.map(c => c.latitude);
  const lngs = caches.map(c => c.longitude);

  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const span = Math.max(latSpan, lngSpan);

  // Empirically tuned thresholds (degrees → zoom)
  if (span < 0.01)  return 15;
  if (span < 0.05)  return 12;
  if (span < 0.15)  return 11;
  if (span < 0.5)   return 10;
  if (span < 1.5)   return 9;
  if (span < 4)     return 8;
  if (span < 10)    return 7;
  if (span < 25)    return 6;
  if (span < 50)    return 5;
  return 4;
}

/** Compute the geographic centroid of a set of caches */
export function centroidOfCaches(caches: Geocache[]): { lat: number; lng: number } {
  return {
    lat: caches.reduce((s, c) => s + c.latitude, 0) / caches.length,
    lng: caches.reduce((s, c) => s + c.longitude, 0) / caches.length,
  };
}
