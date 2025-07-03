import Constants from "expo-constants";

const PROJECT_ID = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
const SUPABASE_URL = Constants?.expoConfig?.extra?.SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants?.expoConfig?.extra?.SUPABASE_ANON_KEY;
const MAPBOX_PUBLIC_TOKEN = Constants?.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN;

export { MAPBOX_PUBLIC_TOKEN, PROJECT_ID, SUPABASE_ANON_KEY, SUPABASE_URL };
