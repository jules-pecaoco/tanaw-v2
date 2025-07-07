/**
 * Creates a stable cache key from a location object by rounding coordinates.
 * This "snaps" the location to a grid to improve cache hits for nearby users.
 * @param {object} location - The location object { latitude, longitude }.
 * @param {number} precision - The number of decimal places to round to. Defaults to 2.
 * @returns {string} A stable string key, e.g., "10.65_122.94".
 */
const createLocationCacheKey = (location, precision = 2) => {
  if (!location?.latitude || !location?.longitude) {
    return null;
  }

  const lat = location.latitude.toFixed(precision);
  const lon = location.longitude.toFixed(precision);

  return `${lat}_${lon}`;
};

export default createLocationCacheKey;
