import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const dtToISOString = (dt: number): string => {
  const date = new Date(dt * 1000);
  return date.toISOString();
};

const extractWeatherArrayData = (item: any) => {
  return {
    main: item.main,
    description: item.description,
    icon: `https://openweathermap.org/img/wn/${item.icon}@2x.png`,
  };
};

const extractHourlyForecastData = (hourlyForecastData: any) => {
  return hourlyForecastData.list.map((item: any) => ({
    weather: extractWeatherArrayData(item.weather[0]),
    heat_index: item.main.feels_like,
    date: dtToISOString(item.dt),
  }));
};

const extractDailyForecastData = (dailyForecastData: any) => {
  return dailyForecastData.list.map((item: any) => ({
    weather: extractWeatherArrayData(item.weather[0]),
    heat_index: item.feels_like.day,
    date: dtToISOString(item.dt),
  }));
};

const extractNearbyLocationData = (nearbyCitiesData: any) => {
  return nearbyCitiesData.list.map((city: any) => ({
    name: city.name,
    weather: extractWeatherArrayData(city.weather[0]),
    heat_index: city.main.feels_like,
    rain: city.rain,
    lat: city.coord.lat,
    lon: city.coord.lon,
    date: dtToISOString(city.dt),
  }));
};

const extractWeatherLayerData = (weatherMapData: any) => {
  const nowcast = weatherMapData.radar?.nowcast || [];
  const past = weatherMapData.radar?.past || [];
  const combined = [...nowcast, ...past];
  combined.sort((a, b) => b.time - a.time);
  const path = combined.map((item: any) => `https://tilecache.rainviewer.com` + item.path + `/256/{z}/{x}/{y}/2/1_0.png`);
  const date = combined.map((item: any) => dtToISOString(item.time));

  return {
    path,
    date,
  };
};

const currentWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching current weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      currentWeather: {
        weather: extractWeatherArrayData(data.weather[0]),
        heat_index: data.main.feels_like,
        date: dtToISOString(data.dt),
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch current weather: ${error.message}`);
  }
};

const hourlyWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&cnt=12&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching hourly weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      hourlyWeather: extractHourlyForecastData(data),
    };
  } catch (error) {
    throw new Error(`Failed to fetch hourly weather: ${error.message} `);
  }
};

const dailyWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching daily weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      dailyWeather: extractDailyForecastData(data),
    };
  } catch (error) {
    throw new Error(`Failed to fetch daily weather: ${error.message}`);
  }
};

const nearbyLocationWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=10&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching nearby cities weather: ${response.statusText}`);
    }
    const data = await response.json();

    return extractNearbyLocationData(data);
  } catch (error) {
    throw new Error(`Failed to fetch nearby cities weather: ${error.message}`);
  }
};

const weatherLayers = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = "https://api.rainviewer.com/public/weather-maps.json";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching weather map URL: ${response.statusText}`);
    }
    const data = await response.json();
    const extractedData = extractWeatherLayerData(data);

    return {
      weatherLayers: {
        version: "1.0.0",
        title: "Weather Maps",
        description: "Weather maps for various weather conditions.",
        attribution: "Data Provided by OpenweatherMap and RainViewer",
        weatherGroups: [
          {
            id: "heat_index",
            name: "Heat Index",
            icon: "https://cdn-icons-png.flaticon.com/512/9066/9066929.png",
            layers: [
              {
                id: "openweathermap_heat_index",
                name: "Heat Index Layer",
                icon: "https://avatars.githubusercontent.com/u/1743227?s=200&v=4",
                tilesetUrl: `http://maps.openweathermap.org/maps/2.0/weather/TD2/{z}/{x}/{y}?appid=${apiKey}&fill_bound=true&opacity=0.3&E6E6E6=25:FFFF00;30:FC8014&date=`,
                sourceLayer: "openweathermap_heat_index",
                source: "OpenWeatherMap",
                interval: 1000 * 60 * 60 * 3, // 3 hours
                maxPastCast: 56,
                maxFutureCast: 56,
                maxZoom: 22,
                nearbyLocationWeather: await nearbyLocationWeather(lat, lon, apiKey),
                legend: {
                  type: "gradient",
                  title: "Heat Index (°C)",
                  stops: [
                    { color: "#E6E6E6", label: "<27" },
                    { color: "#FFFF00", label: "27-32°C" },
                    { color: "#FFCC00", label: "33-41°C" },
                    { color: "#FF6600", label: "42-51°C" },
                    { color: "#CC0001", label: ">52°C" },
                  ],
                },
              },
            ],
          },
          {
            id: "rain",
            name: "Rain",
            icon: "https://cdn-icons-png.flaticon.com/512/3314/3314005.png",
            layers: [
              {
                id: "openweathermap_rain_layer",
                name: "Rain Layer",
                icon: "https://avatars.githubusercontent.com/u/1743227?s=200&v=4",
                tilesetUrl: `http://maps.openweathermap.org/maps/2.0/weather/PR0/{z}/{x}/{y}?appid=${apiKey}&fill_bound=true&opacity=0.7&palette=0.000027:e6f7ff;0.000694:87ceeb;0.00211:1e90ff;0.01388:0000cd&date=`,
                sourceLayer: "openweathermap_rain_layer",
                source: "OpenWeatherMap",
                interval: 1000 * 60 * 60 * 3, // 3 hours
                maxPastCast: 56,
                maxFutureCast: 56,
                maxZoom: 22,
                legend: {
                  type: "gradient",
                  title: "Precipitation Intensity (mm/h)",
                  stops: [
                    { color: "#e6f7ff", label: "0.1 (Light)" }, // Very Light Blue
                    { color: "#87ceeb", label: "2.5 (Moderate)" }, // Sky Blue
                    { color: "#1e90ff", label: "7.6 (Heavy)" }, // Dodger Blue
                    { color: "#0000cd", label: "50 (Violent)" }, // Medium Blue
                  ],
                },
              },
              {
                id: "rainviewer_rain_layer",
                name: "Rain Alt Layer",
                icon: "https://avatars.githubusercontent.com/u/13560729?s=200&v=4",
                tilesetUrl: extractedData.path,
                sourceLayer: "rainviewer_rain_layer",
                source: "RainViewer",
                interval: 1000 * 60 * 10, // 10 minutes
                maxPastCast: 12,
                maxFutureCast: 2,
                maxZoom: 10,
              },
            ],
          },
        ],
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch weather map URL: ${error.message}`);
  }
};

const aggregateWeatherData = async (lat: string, lon: string, apiKey: string) => {
  const [currentWeatherData, hourlyWeatherData, dailyWeatherData, weatherLayersData] = await Promise.all([
    currentWeather(lat, lon, apiKey),
    hourlyWeather(lat, lon, apiKey),
    dailyWeather(lat, lon, apiKey),
    weatherLayers(lat, lon, apiKey),
  ]);

  return {
    ...currentWeatherData,
    ...hourlyWeatherData,
    ...dailyWeatherData,
    ...weatherLayersData,
  };
};

const CACHE_TTL_MINUTES = 20;

Deno.serve(async (req) => {
  // Add CORS headers to the response
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  try {
    const openWeatherApiKey = Deno.env.get("OPENWEATHER_APIKEY");
    const { lat, lon } = await req.json();

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));

    //location key
    const locationKey = `${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;

    const { data: cachedData, error: cacheError } = await supabaseClient
      .from("weather_data_cache")
      .select("data, cached_at")
      .eq("location_key", locationKey)
      .single();
    if (cachedData && !cacheError) {
      const cacheAgeMinutes = (new Date().getTime() - new Date(cachedData.cached_at).getTime()) / 1000 / 60;

      if (cacheAgeMinutes < CACHE_TTL_MINUTES) {
        return new Response(JSON.stringify(cachedData.data), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const aggregatedData = await aggregateWeatherData(lat, lon, openWeatherApiKey);
    const { error: upsertError } = await supabaseClient.from("weather_data_cache").upsert({
      location_key: locationKey,
      data: aggregatedData,
      cached_at: new Date().toISOString(),
    });

    if (upsertError) {
      // Log the error but don't prevent the user from getting data
      console.error("Cache upsert error:", upsertError.message);
    }

    return new Response(JSON.stringify(aggregatedData), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400,
    });
  }
});
