// Constants remain the same
const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
const MAPBOX_SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1/suggest";
const MAPBOX_RETRIEVE_URL = "https://api.mapbox.com/search/searchbox/v1/retrieve";
const MAPBOX_REVERSEGEOCODE_URL = "https://api.mapbox.com/search/geocode/v6/reverse";
const MAPBOX_DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox";

/**
 * Search for cities using Mapbox API
 * @param {string} cityName - The city name to search for
 * @param {object} currentLocation - The user's current location {latitude, longitude}
 * @param {string} sessionToken - Unique token for this search session
 * @returns {Promise<Array>} - List of matching city suggestions
 */
const searchCitySuggestions = async (cityName, currentLocation, sessionToken) => {
  try {
    // 1. Create a URLSearchParams object to build the query string
    const params = new URLSearchParams({
      q: cityName,
      language: "en",
      country: "ph",
      proximity: `${currentLocation.longitude},${currentLocation.latitude}`,
      types: "city",
      session_token: sessionToken,
      access_token: MAPBOX_API_KEY, // Use the constant
    });

    // 2. Make the fetch call with the constructed URL
    const response = await fetch(`${MAPBOX_SEARCH_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Mapbox Search API error: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("Error searching city:", error);
    return [];
  }
};

/**
 * Search for city details using Mapbox API
 * @param {string} cityId - The city id to search for
 * @param {string} session_token - Unique token for this search session
 * @returns {Promise<object|null>} - City details or null
 */
const searchCityDetails = async (cityId, session_token) => {
  try {
    const params = new URLSearchParams({
      language: "en",
      session_token: session_token,
      access_token: MAPBOX_API_KEY,
    });

    const response = await fetch(`${MAPBOX_RETRIEVE_URL}/${cityId}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Mapbox Retrieve API error: ${response.status}`);
    }

    const data = await response.json();
    return data.features[0] || null;
  } catch (error) {
    console.error("Error searching city details:", error);
    return null;
  }
};

/**
 * Fetches directions data from Mapbox Directions API
 * @param {object} origin - Origin coordinates {longitude, latitude}
 * @param {object} destination - Destination coordinates {longitude, latitude}
 * @param {string} profile - Travel profile (driving, walking, cycling)
 * @returns {Promise<object>} - Route data
 */
const fetchDirections = async (location, destination, profile = "driving") => {
  try {
    const waypoints = `${location.longitude},${location.latitude};${destination.longitude},${destination.latitude}`;
    const params = new URLSearchParams({
      alternatives: "false",
      geometries: "geojson",
      language: "en",
      overview: "full",
      steps: "false",
      access_token: MAPBOX_API_KEY,
    });

    const response = await fetch(`${MAPBOX_DIRECTIONS_URL}/${profile}/${waypoints}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox Directions API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance / 1000,
        duration: Math.round(route.duration / 60),
        geometry: route.geometry,
      };
    }

    throw new Error("No routes found");
  } catch (error) {
    console.error("Error fetching directions:", error);
    throw error;
  }
};

/**
 * Reverse geocode latitude and longitude to get location name using Mapbox API
 * @param {Object}  - Latitude * Longitude of the location
 * @returns {Promise<object|null>} - Location details or null
 */
const reverseGeocode = async (location) => {
  const { latitude, longitude } = location;
  try {
    // 1. Create the query parameters
    const params = new URLSearchParams({
      latitude: latitude,
      longitude: longitude,
      access_token: MAPBOX_API_KEY,
    });

    const apiUrl = `${MAPBOX_REVERSEGEOCODE_URL}?${params.toString()}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Mapbox Reverse Geocode API error: ${response.status}`);
    }

    const data = await response.json();

    const context = data.features?.[0]?.properties?.context || {};
    return {
      locality: context.locality?.name,
      city: context.place?.name,
      region: context.region?.name,
    };
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

export { fetchDirections, reverseGeocode, searchCityDetails, searchCitySuggestions };
