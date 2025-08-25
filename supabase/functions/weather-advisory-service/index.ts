import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

interface WeatherAlert {
  severity: "notification" | "alert";
  title: string;
  body: string;
  type: string;
}

interface UserInfo {
  user_id: string;
  expo_token: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface HourlyWeatherData {
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  };
  heat_index: number;
  date: string;
}

// Existing helper functions (keeping your implementations)
async function sendExpoNotification(tokens: string[], title: string, body: string, data: Record<string, any> = {}): Promise<boolean> {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  return response.ok;
}

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
    throw new Error(`Failed to fetch hourly weather: ${error.message}`);
  }
};

const extractHourlyForecastData = (hourlyForecastData: any) => {
  return hourlyForecastData.list.map((item: any) => ({
    weather: extractWeatherArrayData(item.weather[0]),
    heat_index: item.main.feels_like,
    date: dtToISOString(item.dt),
  }));
};

const extractWeatherArrayData = (weather: any) => ({
  id: weather.id,
  main: weather.main,
  description: weather.description,
  icon: weather.icon,
});

const dtToISOString = (dt: number): string => {
  return new Date(dt * 1000).toISOString();
};

// New function to analyze weather with Gemini
async function analyzeWeatherWithGemini(weatherData: HourlyWeatherData[], location: string): Promise<WeatherAlert | null> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: { response_mime_type: "application/json" },
  });

  const prompt = `
You are a weather analysis AI for a disaster alert system. Analyze the 12-hour weather forecast data for location: ${location}.

Weather conditions to monitor:
- Extreme temperatures (heat index > 40°C or < 0°C)
- Severe weather (thunderstorms, heavy rain, strong winds)
- Weather condition IDs that indicate hazards (2xx = thunderstorms, 5xx = rain, 6xx = snow, 7xx = atmosphere issues)

Classification rules:
- ALERT: Immediate danger requiring action (severe storms, extreme heat/cold, dangerous conditions)
- NOTIFICATION: General weather awareness (light rain, mild temperature changes, general updates)
- NULL: No significant weather concerns

For NOTIFICATION (short & concise):
- Title: Max 30 characters
- Body: Max 80 characters
- Focus on brief weather update

For ALERT (descriptive with actionable advice):
- Title: Max 50 characters  
- Body: Max 150 characters
- Include what to do or prepare for

Weather data: ${JSON.stringify(weatherData)}

Respond ONLY in this JSON format:
{
  "severity": "notification" | "alert" | null,
  "title": string | null,
  "body": string | null,
  "type": string | null
}
`;

  try {
    const result = await model.generateContent([prompt]);
    const responseText = result.response.text();
    const analysis = JSON.parse(responseText);

    return analysis.severity ? analysis : null;
  } catch (err) {
    console.error("Gemini analysis error:", err);
    return null;
  }
}

// Function to determine if weather conditions warrant an alert
function shouldAlert(weatherData: HourlyWeatherData[]): boolean {
  return weatherData.some((hour) => {
    // Check for severe weather conditions
    const weatherId = hour.weather.id;
    const heatIndex = hour.heat_index;

    return (
      (weatherId >= 200 && weatherId < 300) || // Thunderstorms
      (weatherId >= 500 && weatherId < 600) || // Rain (heavy)
      (weatherId >= 600 && weatherId < 700) || // Snow
      (weatherId >= 700 && weatherId < 800) || // Atmospheric conditions
      heatIndex > 40 || // Extreme heat
      heatIndex < 0 // Freezing
    );
  });
}

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_APIKEY")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENWEATHER_API_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log("Starting weather alert cron job...");

    // Fetch all users with their location and expo tokens
    const { data: users, error } = await supabase
      .from("user-info")
      .select("user_id, expo_token, location")
      .not("expo_token", "is", null)
      .not("location", "is", null);

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    console.log(`Processing ${users?.length || 0} users...`);

    const results = {
      processed: 0,
      notifications_sent: 0,
      alerts_sent: 0,
      errors: 0,
    };

    // Process each user
    for (const user of users || []) {
      try {
        const [longitude, latitude] = user.location.coordinates;

        // Get weather data for user's location
        const { hourlyWeather: weatherData } = await hourlyWeather(latitude.toString(), longitude.toString(), OPENWEATHER_API_KEY);

        // Analyze weather conditions with Gemini
        const analysis = await analyzeWeatherWithGemini(weatherData, `${latitude}, ${longitude}`);

        if (analysis && analysis.severity) {
          // Send notification based on severity
          const success = await sendExpoNotification([user.expo_token], analysis.title, analysis.body, {
            type: analysis.severity,
            weather_type: analysis.type,
            user_id: user.user_id,
            timestamp: new Date().toISOString(),
          });

          if (success) {
            if (analysis.severity === "alert") {
              results.alerts_sent++;
            } else {
              results.notifications_sent++;
            }
            console.log(`${analysis.severity} sent to user ${user.user_id}: ${analysis.title}`);
          } else {
            console.error(`Failed to send ${analysis.severity} to user ${user.user_id}`);
            results.errors++;
          }
        }

        results.processed++;

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        results.errors++;
      }
    }

    console.log("Weather alert cron job completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Weather alert cron job completed successfully",
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Weather alert cron job error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
