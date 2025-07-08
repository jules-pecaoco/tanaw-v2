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
    lat: city.coord.lat,
    lon: city.coord.lon,
    date: dtToISOString(city.dt),
  }));
};

const extractCitiesWeatherData = (citiesWeatherData: any) => {
  return citiesWeatherData.list.map((city: any) => ({
    name: city.name,
    weather: extractWeatherArrayData(city.weather[0]),
    heat_index: city.main.feels_like,
    lat: city.coord.Lat,
    lon: city.coord.Lon,
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
        weather: data.weather[0],
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
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=12&units=metric&appid=${apiKey}`;
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
    return {
      nearbyLocationWeather: extractNearbyLocationData(data),
    };
  } catch (error) {
    throw new Error(`Failed to fetch nearby cities weather: ${error.message}`);
  }
};

const citiesWeather = async (apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/box/city?bbox=122.0,9.0,123.6,11.2,10&units=metrics&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching nearby cities weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      citiesWeather: extractCitiesWeatherData(data),
    };
  } catch (error) {
    throw new Error(`Failed to fetch nearby cities weather: ${error.message}`);
  }
};

const weatherLayers = async (apiKey: string) => {
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
                tilesetUrl: `http://maps.openweathermap.org/maps/2.0/weather/TD2/{z}/{x}/{y}?&appid=${apiKey}&date=`,
                sourceLayer: "openweathermap_heat_index",
                source: "OpenWeatherMap",
                interval: 1000 * 60 * 60 * 3, // 3 hours
                maxPastCast: 56,
                maxFutureCast: 56,
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
                tilesetUrl: `http://maps.openweathermap.org/maps/2.0/weather/PR0/{z}/{x}/{y}?appid=${apiKey}&date=`,
                sourceLayer: "openweathermap_rain_layer",
                source: "OpenWeatherMap",
                interval: 1000 * 60 * 60 * 3, // 3 hours
                maxPastCast: 56,
                maxFutureCast: 56,
              },
              {
                id: "rainviewer_rain_layer",
                name: "Rain Alt Layer",
                icon: "https://avatars.githubusercontent.com/u/13560729?s=200&v=4",
                tilesetUrl: extractedData.path,
                sourceLayer: "rainviewer_rain_layer",
                source: "RainViewer",
                interval: 1000 * 60 * 10, // 10 minutes
                maxPastCast: 13,
                maxFutureCast: 0,
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

const hazardLayers = () => {
  return {
    hazardLayers: {
      version: "1.0.0",
      title: "Hazard Maps",
      description: "Hazard maps for various natural disasters.",
      attribution: "Data provided by Project NOAH",
      hazardGroups: [
        {
          id: "flood",
          name: "Flood Hazards",
          icon: "https://cdn-icons-png.flaticon.com/512/4668/4668660.png",
          layers: [
            {
              id: "flood_100_year",
              name: "Flood 100 Year",
              tilesetUrl: "mapbox://jules-pecaoco-dev.4p3rwjm0",
              sourceLayer: "flood_100_year",
              style: {
                type: "fill",
                property: "Var",
                stops: [
                  [1, "#b047ff"],
                  [2, "#5a00ff"],
                  [3, "#002474"],
                ],
                opacity: 0.7,
              },
            },
            // {
            //   id: "flood_25_year",
            //   name: "Flood 25 Year",
            //   tilesetUrl: "mapbox://jules-pecaoco-dev.4p3rwjm0",
            //   sourceLayer: "flood_25_year",
            //   style: {
            //     type: "fill",
            //     property: "Var",
            //     stops: [
            //       [1, "#b047ff"],
            //       [2, "#5a00ff"],
            //       [3, "#002474"],
            //     ],
            //     opacity: 0.7,
            //   },
            // },
            // {
            //   id: "flood_5_year",
            //   name: "Flood 5 Year",
            //   tilesetUrl: "mapbox://jules-pecaoco-dev.4p3rwjm0",
            //   sourceLayer: "flood_5_year",
            //   style: {
            //     type: "fill",
            //     property: "Var",
            //     stops: [
            //       [1, "#b047ff"],
            //       [2, "#5a00ff"],
            //       [3, "#002474"],
            //     ],
            //     opacity: 0.7,
            //   },
            // },
          ],
        },
        {
          id: "landslide",
          name: "Landslide",
          icon: "https://cdn-icons-png.flaticon.com/512/3920/3920979.png",
          layers: [
            {
              id: "landslide_hazards",
              name: "Landslide Susceptibility",
              tilesetUrl: "mapbox://jules-pecaoco-dev.cxsao32r",
              sourceLayer: "landslide_hazards",
              style: {
                type: "fill",
                property: "LH",
                stops: [
                  [1, "#ff0000"],
                  [2, "#FFA500"],
                  [3, "#FF4500"],
                ],
                opacity: 0.7,
              },
            },
          ],
        },
        {
          id: "storm_surge",
          name: "Storm Surge",
          icon: "https://cdn-icons-png.flaticon.com/512/2875/2875972.png",
          layers: [
            {
              id: "storm_surge_ssa1",
              name: "dvisory 1",
              tilesetUrl: "mapbox://jules-pecaoco-dev.dadr2cdn",
              sourceLayer: "storm_surge_ssa1",
              style: {
                type: "fill",
                property: "HAZ",
                stops: [
                  [1, "#e3d1ff"],
                  [2, "#b047ff"],
                  [3, "#5a00ff"],
                ],
                opacity: 0.7,
              },
            },
            {
              id: "storm_surge_ssa2",
              name: "Advisory 2",
              tilesetUrl: "mapbox://jules-pecaoco-dev.dadr2cdn",
              sourceLayer: "storm_surge_ssa2",
              style: {
                type: "fill",
                property: "HAZ",
                stops: [
                  [1, "#e3d1ff"],
                  [2, "#b047ff"],
                  [3, "#5a00ff"],
                ],
                opacity: 0.7,
              },
            },
            {
              id: "storm_surge_ssa3",
              name: "Advisory 3",
              tilesetUrl: "mapbox://jules-pecaoco-dev.dadr2cdn",
              sourceLayer: "storm_surge_ssa3",
              style: {
                type: "fill",
                property: "HAZ",
                stops: [
                  [1, "#e3d1ff"],
                  [2, "#b047ff"],
                  [3, "#5a00ff"],
                ],
                opacity: 0.7,
              },
            },
            {
              id: "storm_surge_ssa4",
              name: "Advisory 4",
              tilesetUrl: "mapbox://jules-pecaoco-dev.dadr2cdn",
              sourceLayer: "storm_surge_ssa4",
              style: {
                type: "fill",
                property: "HAZ",
                stops: [
                  [1, "#e3d1ff"],
                  [2, "#b047ff"],
                  [3, "#5a00ff"],
                ],
                opacity: 0.7,
              },
            },
          ],
        },
      ],
    },
  };
};

const aggregateWeatherData = async (lat: string, lon: string, apiKey: string) => {
  const currentWeatherData = await currentWeather(lat, lon, apiKey);
  const hourlyWeatherData = await hourlyWeather(lat, lon, apiKey);
  const dailyWeatherData = await dailyWeather(lat, lon, apiKey);
  const nearbyLocationData = await nearbyLocationWeather(lat, lon, apiKey);
  const citiesWeatherData = await citiesWeather(apiKey);
  const weatherLayersData = await weatherLayers(apiKey);
  const hazardLayersData = hazardLayers();
  return {
    ...currentWeatherData,
    ...hourlyWeatherData,
    ...dailyWeatherData,
    ...nearbyLocationData,
    ...citiesWeatherData,
    ...weatherLayersData,
    ...hazardLayersData,
  };
};

const CACHE_TTL_MINUTES = 20;

Deno.serve(async (req) => {
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
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const aggregatedData = await aggregateWeatherData(lat, lon, openWeatherApiKey);
    const { error: upsertError } = await supabaseClient.from("weather_data_cache").upsert({
      location_key: locationKey,
      data: aggregatedData,
      cached_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(aggregatedData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
