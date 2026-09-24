/**
 * Rumus Haversine untuk menghitung jarak antara 2 titik koordinat GPS di permukaan bumi
 * @param lat1 Latitude titik 1 (misal: GPS pegawai)
 * @param lon1 Longitude titik 1
 * @param lat2 Latitude titik 2 (misal: GPS kantor)
 * @param lon2 Longitude titik 2
 * @returns Jarak dalam satuan METER (dibulatkan 2 desimal)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius rata-rata bumi dalam meter
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Validasi apakah koordinat pegawai berada dalam radius kantor
 * @param userLat Latitude pegawai
 * @param userLon Longitude pegawai
 * @param officeLat Latitude kantor
 * @param officeLon Longitude kantor
 * @param maxRadiusMeter Batas radius kantor dalam meter
 */
export function isWithinOfficeRadius(
  userLat: number,
  userLon: number,
  officeLat: number,
  officeLon: number,
  maxRadiusMeter: number
): { isWithin: boolean; distance: number } {
  const distance = calculateHaversineDistance(userLat, userLon, officeLat, officeLon);
  return {
    isWithin: distance <= maxRadiusMeter,
    distance,
  };
}
