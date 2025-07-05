// services/api.js
import { supabase } from "./supabase";

/**
 * Fetches nearby reports from the database.
 * @param {object} location - The user's location { latitude, longitude }.
 * @param {number} radiusInKm - The search radius in kilometers.
 * @param {number} limit - The maximum number of results to return.
 * @returns {Promise<Array>} A promise that resolves to an array of reports.
 */
const getNearbyReports = async (location, { radiusInKm = 10, limit = 50 }) => {
  if (!location) {
    throw new Error("Location is required to fetch nearby reports.");
  }

  const { data, error } = await supabase.rpc("search_reports_by_location", {
    user_lat: location.latitude,
    user_lon: location.longitude,
    radius_m: radiusInKm * 1000,
    result_limit: limit,
  });

  if (error) {
    throw error;
  }

  return data || [];
};

/** * Submits a new report to the database.
 * @param {object} report - The report object containing title, description, and location.
 * @returns {Promise<object>} A promise that resolves to the submitted report.
 */

const submitReport = async (report) => {
  if (!report || !report.title || !report.description || !report.location) {
    throw new Error("Report must have title, description, and location.");
  }

  const { data, error } = await supabase.from("user_reports").insert([report]).select();

  if (error) {
    throw error;
  }

  return data[0];
};

export { getNearbyReports, submitReport };
