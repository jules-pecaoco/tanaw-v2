import supabase from "./supabase";

/** * Fetches weather data for a given location using Supabase Functions.
 * @param {Object} location - The location object containing latitude and longitude.
 * @returns {Promise<Object|null>} The weather data or null if an error occurs.
 */
const fetchWeatherData = async (location) => {
  const { data, error } = await supabase.functions.invoke("weather-service", {
    body: { name: "Functions", lat: location.latitude, lon: location.longitude },
  });

  if (error) {
    return null;
  }

  return data;
};

/** * Fetches weather data for a given location using Supabase Functions.
 * @param {Object} location - The location object containing latitude and longitude.
 * @returns {Promise<Object|null>} The weather data or null if an error occurs.
 */
const fetchHazardData = async () => {
  const { data, error } = await supabase.functions.invoke("hazard-service", {
    body: { name: "Functions" },
  });

  if (error) {
    return null;
  }

  return data;
};

export { fetchHazardData, fetchWeatherData };
