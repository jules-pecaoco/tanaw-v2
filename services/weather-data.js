import supabase from "./supabase";

/** * Fetches weather data for a given location using Supabase Functions.
 * @param {Object} location - The location object containing latitude and longitude.
 * @returns {Promise<Object|null>} The weather data or null if an error occurs.
 */
const getWeatherData = async (location) => {
  const { data, error } = await supabase.functions.invoke("weather-service", {
    body: { name: "Functions", lat: location.latitude, lon: location.longitude },
  });

  if (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }

  return data;
};

export default getWeatherData;
