import supabase from "./supabase";

/** * Fetches weather data for a given location using Supabase Functions.
 * @param {Object} location - The location object containing latitude and longitude.
 * @returns {Promise<Object|null>} The weather data or null if an error occurs.
 */
const getFacilitiesData = async (location) => {
  console.log("Fetching facilities data for locattieion:", location);
  const { data, error } = await supabase.functions.invoke("facilities-service", {
    body: { name: "Functions", latitude: location.latitude, longitude: location.longitude },
  });

  if (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }

  return data;
};

export default getFacilitiesData;
