import { Geocache } from '../../types';

/**
 * Estimate an appropriate map zoom level based on the bounding box
 * of a set of geocaches.
 *
 * Design rule:
 *   - Clustered markers (small spread)  → zoom ≥ 14
 *   - Dispersed markers (large spread)  → zoom < 14
 *
 * @param caches   - Array of caches (must have .latitude / .longitude)
 * @param fallback - Zoom level to use when only one point is present (default 16)
 */
export function zoomForCaches(caches: Geocache[], fallback = 16): number {
  if (caches.length <= 1) return fallback;

  const lats = caches.map(c => c.latitude);
  const lngs = caches.map(c => c.longitude);

  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const span = Math.max(latSpan, lngSpan);

  // span (degrees) → zoom  [clustered = ≥14, dispersed = <14]
  if (span < 0.003) return 17;   // ~300 m  — very tight cluster
  if (span < 0.008) return 16;   // ~800 m
  if (span < 0.02)  return 15;   // ~2 km
  if (span < 0.06)  return 14;   // ~6 km  ← boundary
  if (span < 0.15)  return 13;   // ~15 km
  if (span < 0.4)   return 12;
  if (span < 1.0)   return 11;
  if (span < 2.5)   return 10;
  if (span < 5)     return 9;
  if (span < 12)    return 8;
  if (span < 25)    return 7;
  if (span < 50)    return 6;
  if (span < 100)   return 5;
  return 4;
}

/** Compute the geographic centroid of a set of caches */
export function centroidOfCaches(caches: Geocache[]): { lat: number; lng: number } {
  return {
    lat: caches.reduce((s, c) => s + c.latitude, 0) / caches.length,
    lng: caches.reduce((s, c) => s + c.longitude, 0) / caches.length,
  };
}
