import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const dtToISOString = (dt: number): string => {
  const date = new Date(dt * 1000);
  return date.toISOString();
}

const extractHourlyForecastData = (hourlyForecastData: any) => {
  return hourlyForecastData.list.map((item: any) => ({
    weather: item.weather[0],
    heat_index: item.main.feels_like,
    date: dtToISOString(item.dt)
  }));
}

const extractDailyForecastData = (dailyForecastData: any) => {
  return dailyForecastData.list.map((item: any) => ({
    weather: item.weather[0],
    heat_index: item.feels_like.day,
    date: dtToISOString(item.dt)
  }));
}

const extractWeatherMapData = (weatherMapData: any) => {
  const nowcast = weatherMapData.radar?.nowcast || [];
  const past = weatherMapData.radar?.past || [];
  const combined = [...nowcast, ...past];
  combined.sort((a, b) => b.time - a.time);
  const path = combined.map((item: any) => `https://tilecache.rainviewer.com` + item.path);
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

const weatherMaps = async (apiKey: string) => {
  try{
    const url = 'https://api.rainviewer.com/public/weather-maps.json';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching weather map URL: ${response.statusText}`);
    }
    const data = await response.json(); 
    const extractedData = extractWeatherMapData(data);
  
    return {
      weatherMapURL:{
        heat_index: `http://maps.openweathermap.org/maps/2.0/weather/TA2/{z}/{x}/{y}?appid=${apiKey}`,
        rain: extractedData.path,
        date: extractedData.date,
      }
    }
  } catch (error) {
    throw new Error(`Failed to fetch weather map URL: ${error.message}`);
  }
}

const aggregateWeatherData = async (lat: string, lon: string, apiKey: string) => {
  const currentWeatherData = await currentWeather(lat, lon, apiKey);
  const hourlyWeatherData = await hourlyWeather(lat, lon, apiKey);
  const dailyWeatherData = await dailyWeather(lat, lon, apiKey);
  const weatherMapsData = await weatherMaps(apiKey);
  return {
    ...currentWeatherData,
    ...hourlyWeatherData,
    ...dailyWeatherData,
    ...weatherMapsData
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
      JSON.stringify({ error: error.message}),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});

