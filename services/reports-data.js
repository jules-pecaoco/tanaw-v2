import supabase from "./supabase"; // Your configured Supabase client

/**
 * Fetches user reports from the last 48 hours.
 *
 * This function is designed to be called by React Query.
 * It explicitly selects only the necessary, safe-to-expose columns.
 * It also transforms the geometry data into a format easily usable by Mapbox.
 */

export const fetchUserReports = async () => {
  // Calculate the timestamp for 7 days ago
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent reports from the database
  const { data, error } = await supabase
    .from("user_reports")
    .select(
      `
      id,
      type,
      sub_type,
      description,
      media_path,
      location,
      location_name,
      created_at
    `
    )
    .gte("created_at", sevenDaysAgo); // Filter for recent reports for performance

  if (error) {
    console.error("Error fetching user reports:", error);
    throw new Error(error.message);
  }

  // Transform the data to a more UI-friendly format
  const transformedData = data.map((report) => ({
    ...report,
    coordinates: report.location.coordinates,
  }));

  return transformedData;
};
