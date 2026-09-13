// ============================================================================
// UTILIDADES DE GEOLOCALIZACIÓN
// Cálculo de distancia entre el comprador y un emprendimiento, usando la
// fórmula de Haversine (distancia en línea recta "a vuelo de pájaro", no
// tiene en cuenta calles ni edificios — es una aproximación suficiente para
// ordenar resultados por cercanía).
// ============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

// Distancia entre la ubicación del usuario y un emprendimiento. Devuelve
// null si falta cualquiera de las dos ubicaciones (por ejemplo, el
// emprendimiento nunca configuró la suya).
export function distanceToBusiness(
  userLocation: Coordinates | null | undefined,
  business: { latitude?: number | null; longitude?: number | null } | null | undefined
): number | null {
  if (!userLocation || !business) return null;
  if (business.latitude == null || business.longitude == null) return null;
  return distanceMeters(userLocation, {
    latitude: business.latitude,
    longitude: business.longitude,
  });
}

// "350 m" o "1.2 km" — null si no hay distancia que mostrar.
export function formatDistance(meters: number | null | undefined): string | null {
  if (meters == null || Number.isNaN(meters)) return null;
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
