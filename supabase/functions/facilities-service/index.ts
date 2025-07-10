import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ----- Helper Function: Generic Place Searcher -----
const searchPlacesByType = async (location: { latitude: number; longitude: number }, includedTypes: string[], apiKey: string) => {
  const apiUrl = "https://places.googleapis.com/v1/places:searchNearby";
  const requestBody = {
    includedTypes,
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: 5000.0,
      },
    },
  };
  const requestHeaders = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask":
      "places.displayName,places.types,places.location,places.internationalPhoneNumber,places.nationalPhoneNumber,places.primaryTypeDisplayName,places.shortFormattedAddress",
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      console.error(`Google Places API error for types [${includedTypes.join(", ")}]: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.places || [];
  } catch (error) {
    console.error(`Failed to fetch places of type [${includedTypes.join(", ")}]:`, error);
    return [];
  }
};

const fetchAndGroupFacilities = async (location: { latitude: number; longitude: number }, apiKey: string) => {
  const [hospitalResults, fireStationResults, schoolResults] = await Promise.all([
    searchPlacesByType(location, ["hospital"], apiKey),
    searchPlacesByType(location, ["fire_station"], apiKey),
    searchPlacesByType(location, ["primary_school", "secondary_school"], apiKey),
  ]);

  const hospitals = hospitalResults.map((place: any) => ({
    id: place.name,
    name: place.displayName.text,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    international_phone_number: place.internationalPhoneNumber,
    national_phone_number: place.nationalPhoneNumber,
    short_address: place.shortFormattedAddress,
    category: "hospital",
  }));

  const fireStations = fireStationResults.map((place: any) => ({
    id: place.name,
    name: place.displayName.text,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    international_phone_number: place.internationalPhoneNumber,
    national_phone_number: place.nationalPhoneNumber,
    short_address: place.shortFormattedAddress,
    category: "fire_station",
  }));

  const evacSites = schoolResults.map((place: any) => ({
    id: place.name,
    name: place.displayName.text,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    international_phone_number: place.internationalPhoneNumber,
    national_phone_number: place.nationalPhoneNumber,
    short_address: place.shortFormattedAddress,
    category: "evac_site",
  }));

  const allFacilities = [...hospitals, ...fireStations, ...evacSites];

  return allFacilities;
};

// ----- Main Edge Function Handler -----
Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("Google API key not set.");

    const { latitude, longitude } = await req.json();
    if (!latitude || !longitude) throw new Error("Latitude and longitude are required.");

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));

    const CACHE_STALE_HOURS = 24;
    const CACHE_SEARCH_RADIUS_METERS = 5000;

    // Check for a nearby and recent cache entry ---
    const { data: cachedResult, error: cacheError } = await supabaseClient.rpc("find_nearby_facilities_cache", {
      user_lat: latitude,
      user_lon: longitude,
      search_radius: CACHE_SEARCH_RADIUS_METERS,
    });

    if (cacheError) {
      console.error("Cache lookup RPC failed:", cacheError.message);
    }

    if (cachedResult) {
      const cacheAgeHours = (new Date().getTime() - new Date(cachedResult.cached_at).getTime()) / 1000 / 60 / 60;
      if (cacheAgeHours < CACHE_STALE_HOURS) {
        console.log(`CACHE HIT: Using cached data from ${cachedResult.distance_km.toFixed(2)}km away.`);
        return new Response(JSON.stringify(cachedResult.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch new data if cache is missed ---
    console.log("CACHE MISS: No recent cache found nearby. Fetching new data.");
    const facilitiesData = await fetchAndGroupFacilities({ latitude, longitude }, apiKey);

    //  Save the new data to the cache ---
    const { error: insertError } = await supabaseClient.from("facilities_cache").insert({
      location: `POINT(${longitude} ${latitude})`,
      data: facilitiesData,
      cached_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Failed to save new cache entry:", insertError.message);
    }

    // Return the fresh data ---
    return new Response(JSON.stringify(facilitiesData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
