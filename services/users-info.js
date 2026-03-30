import supabase from "./supabase";

/**
 * Upserts user information in the database.
 *
 * @param {string} id - The user ID to upsert data for.
 * @param {string} expo_token - The Expo push notification token.
 * @param {Object} location - The location object containing latitude and longitude.
 * @param {number} location.latitude - The latitude coordinate.
 * @param {number} location.longitude - The longitude coordinate.
 * @returns {Promise<Object|null>} The upserted user data or null if an error occurs.
 */
const upsertUserInfo = async (id, expo_token, location) => {
  const { latitude, longitude } = location;
  const dateNow = new Date().toISOString();


  const { data, error } = await supabase
    .from("user_info")
    .upsert({
      user_id: id,
      expo_token: expo_token,
      location: `POINT(${longitude} ${latitude})`,
      updates_at: dateNow,
    })
    .select();

  if (error) {
    return null;
  }

  return data;
};

export default upsertUserInfo;
