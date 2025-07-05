import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const dtToISOString = (dt: number): string => {
  const date = new Date(dt * 1000);
  return date.toISOString();
}

const extractWeatherArrayData = (item: any) => {
  return {
    main: item.main,
    description: item.description,
    icon: `https://openweathermap.org/img/wn/${item.icon}@2x.png`
  }
}

const extractHourlyForecastData = (hourlyForecastData: any) => {
  return hourlyForecastData.list.map((item: any) => ({
    weather: extractWeatherArrayData(item.weather[0]),
    heat_index: item.main.feels_like,
    date: dtToISOString(item.dt)
  }));
}

const extractDailyForecastData = (dailyForecastData: any) => {
  return dailyForecastData.list.map((item: any) => ({
    weather: extractWeatherArrayData(item.weather[0]),
    heat_index: item.feels_like.day,
    date: dtToISOString(item.dt)
  }));
}

const extractNearbyLocationData = (nearbyCitiesData: any) => {
  return nearbyCitiesData.list.map((city: any) => ({
    name: city.name,
    weather: extractWeatherArrayData(city.weather[0]),
    heat_index: city.main.feels_like,
    lat: city.coord.lat,
    lon: city.coord.lon,
    date: dtToISOString(city.dt),

  }));
}

const extractCitiesWeatherData = (citiesWeatherData: any) => {
  return citiesWeatherData.list.map((city: any) => ({
    name: city.name,
    weather: extractWeatherArrayData(city.weather[0]),
    heat_index: city.main.feels_like,
    lat: city.coord.Lat,
    lon: city.coord.Lon,
    date: dtToISOString(city.dt),
  }));
}

const extractWeatherMapData = (weatherMapData: any) => {
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
        date: dtToISOString(data.dt)
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch current weather: ${error.message}`);
  }
}

const hourlyWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=12&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching hourly weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      hourlyWeather: extractHourlyForecastData(data)
    };
  } catch (error) {
    throw new Error(`Failed to fetch hourly weather: ${error.message} `);
  }
}

const dailyWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching daily weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      dailyWeather: extractDailyForecastData(data)
    };
  } catch (error) {
    throw new Error(`Failed to fetch daily weather: ${error.message}`);
  }
}


const nearbyLocationWeather = async (lat: string, lon: string, apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=10&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching nearby cities weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      nearbyLocationWeather: extractNearbyLocationData(data)
    };
  } catch (error) {
    throw new Error(`Failed to fetch nearby cities weather: ${error.message}`);
  }
}

const citiesWeather = async (apiKey: string) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/box/city?bbox=122.0,9.0,123.6,11.2,10&units=metrics&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching nearby cities weather: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      citiesWeather: extractCitiesWeatherData(data)
    };
  } catch (error) {
    throw new Error(`Failed to fetch nearby cities weather: ${error.message}`);
  }
}

const weatherMaps = async (apiKey: string) => {
  try {
    const url = 'https://api.rainviewer.com/public/weather-maps.json';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching weather map URL: ${response.statusText}`);
    }
    const data = await response.json();
    const extractedData = extractWeatherMapData(data);

    return {
      weatherMapURL: {
        heat_index: `http://maps.openweathermap.org/maps/2.0/weather/TD2/{z}/{x}/{y}?&appid=${apiKey}&fill_bound=true&opacity=1&palette=-65:821692; -55:821692; -45:821692;-40:821692;-30:8257DB;-20:208CEC;-10:20C4E8; 0:23DDDD;10:C2FF28;20:FFF028;25:FFC228;30:FC8014&date=`,
        rain: `http://maps.openweathermap.org/maps/2.0/weather/PR0/{z}/{x}/{y}?appid=${apiKey}&date=`,
        rain_alt: extractedData.path,
        date: extractedData.date,
      }
    }
  } catch (error) {
    throw new Error(`Failed to fetch weather map URL: ${error.message}`);
  }
}

const hazardMaps = () => {
  return {
    hazardMapURL: {
      host: "mapbox://jules-pecaoco-dev",
      hazards: [
        {
          name: "Flood",
          id: "4p3rwjm0",
          fields: {
            get: "Var",
            minVal: 1,
            maxVal: 3,
            style: [
              "#b047ff",
              "#5a00ff",
              "#002474"
            ]
          },
          layers: [
            {
              name: "Flood 100 Year",
              id: "flood_100_year",
            },
            {
              name: "Flood 25 Year",
              id: "flood_25_year",
            },
            {
              name: "Flood 5 Year",
              id: "flood_5_year",
            }
          ]
        },
        {
          name: "Landslide",
          id: "cxsao32r",
          fields: {
            get: "LH",
            minVal: 1,
            maxVal: 3,
            style: [
              "#ff0000",
              "#FFA500",
              "#FF4500"
            ]
          },
          layers: [
            {
              name: "Landslide Susceptibility",
              id: "landslide_hazards",
            }
          ]
        },
        {
          name: "Storm Surge",
          id: "dadr2cdn",
          fields: {
            get: "HAZ",
            minVal: 1,
            maxVal: 3,
            style: [
              "#e3d1ff",
              "#b047ff",
              "#5a00ff"
            ]
          },
          layers: [
            {
              name: "Storm Surge Advisory 1",
              id: "storm_surge_ssa1",
            },
            {
              name: "Storm Surge Advisory 2",
              id: "storm_surge_ssa2",
            },
            {
              name: "Storm Surge Advisory 3",
              id: "storm_surge_ssa3",
            },
            {
              name: "Storm Surge Advisory 4",
              id: "storm_surge_ssa4",
            }
          ]
        }
      ]
    }
  }
}

const aggregateWeatherData = async (lat: string, lon: string, apiKey: string) => {
  const currentWeatherData = await currentWeather(lat, lon, apiKey);
  const hourlyWeatherData = await hourlyWeather(lat, lon, apiKey);
  const dailyWeatherData = await dailyWeather(lat, lon, apiKey);
  const nearbyLocationData = await nearbyLocationWeather(lat, lon, apiKey);
  const citiesWeatherData = await citiesWeather(apiKey);
  const weatherMapsData = await weatherMaps(apiKey);
  const hazardMapsData = hazardMaps();
  return {
    ...currentWeatherData,
    ...hourlyWeatherData,
    ...dailyWeatherData,
    ...nearbyLocationData,
    ...citiesWeatherData,
    ...weatherMapsData,
    ...hazardMapsData,
  };
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('OPENWEATHER_APIKEY');
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const data = await aggregateWeatherData(lat, lon, apiKey);
    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});

