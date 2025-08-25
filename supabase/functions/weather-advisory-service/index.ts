// File: supabase/functions/weather-alert-cron/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

// --- MODIFIED: The UserInfo interface is no longer needed as we use the RPC's return shape ---

interface WeatherAlert {
  severity: "notification" | "alert";
  title: string;
  body: string;
  type: string;
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

interface UserProcessingResult {
  user_id: string;
  status: "success" | "error";
  message?: string; // Error message or success confirmation
  alert_severity?: WeatherAlert["severity"] | null;
  alert_title?: WeatherAlert["title"] | null;
  alert_body?: WeatherAlert["body"] | null;
  alert_type?: WeatherAlert["type"] | null;
}

// --- All helper functions below remain unchanged ---

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
      throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
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

function parseGeminiResponse(responseText: string): WeatherAlert | null {
  const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  let jsonString = markdownMatch ? markdownMatch[1] : responseText;
  if (!markdownMatch) {
    const jsonObjectMatch = jsonString.match(/({[\s\S]*})/);
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[1];
    }
  }
  try {
    const parsedData = JSON.parse(jsonString);
    if (parsedData && typeof parsedData === "object" && "severity" in parsedData) {
      const allowedSeverities = ["notification", "alert", null];
      if (!allowedSeverities.includes(parsedData.severity)) {
        throw new Error(`Invalid severity value: ${parsedData.severity}`);
      }
      return parsedData as WeatherAlert;
    } else {
      throw new Error("Response does not contain expected 'severity' key.");
    }
  } catch (parseError) {
    console.error("Gemini JSON parsing error. Original response text:", responseText);
    console.error("Attempted to parse:", jsonString);
    console.error("Parsing error details:", parseError.message);
    return null;
  }
}

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
    const analysis = parseGeminiResponse(responseText);
    return analysis;
  } catch (err) {
    console.error("Gemini API call error:", err);
    return null;
  }
}

// --- Main Deno.serve function with modifications ---

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_APIKEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENWEATHER_API_KEY || !GEMINI_API_KEY) {
    console.error("Missing required environment variables");
    return new Response(JSON.stringify({ success: false, message: "Configuration error: Missing required environment variables." }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("Starting weather alert cron job...");

  // --- MODIFIED: Call the database RPC function instead of querying the table directly ---
  const { data: users, error: dbError } = await supabase.rpc("get_users_for_weather_alerts");

  if (dbError) {
    console.error("Supabase DB error:", dbError.message);
    return new Response(JSON.stringify({ success: false, message: "Failed to fetch user data from Supabase.", error: dbError.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  if (!users || users.length === 0) {
    console.log("No users found with tokens and locations.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No users found to process.",
        results: { processed: 0, notifications_sent: 0, alerts_sent: 0, errors: 0, user_details: [] },
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }

  console.log(`Processing ${users.length} users...`);

  const allUserResults: UserProcessingResult[] = [];
  let totalNotificationsSent = 0;
  let totalAlertsSent = 0;
  let totalErrors = 0;

  for (const user of users) {
    const userResult: UserProcessingResult = {
      user_id: user.user_id,
      status: "error",
      message: "",
    };

    try {
      // --- MODIFIED: Logic to parse the GeoJSON string from the RPC ---
      // 1. Validate that location_geojson from the RPC exists and is a string
      if (typeof user.location_geojson !== "string" || user.location_geojson.trim() === "") {
        throw new Error("User location data from database is not a valid GeoJSON string.");
      }

      // 2. Parse the GeoJSON string into an object
      const locationObject = JSON.parse(user.location_geojson);

      // 3. Validate the parsed object's structure
      if (!locationObject || !Array.isArray(locationObject.coordinates) || locationObject.coordinates.length < 2) {
        throw new Error("Parsed location object is invalid or missing coordinates.");
      }

      // 4. Destructure the coordinates - this will now succeed!
      const [longitude, latitude] = locationObject.coordinates;

      // The rest of the logic continues as before, now with correct lat/lon values
      const weatherResponse = await hourlyWeather(latitude.toString(), longitude.toString(), OPENWEATHER_API_KEY);
      const weatherData = weatherResponse.hourlyWeather;

      if (!weatherData || weatherData.length === 0) {
        throw new Error("No weather data returned from API.");
      }

      const analysis = await analyzeWeatherWithGemini(weatherData, `${latitude}, ${longitude}`);

      if (analysis && analysis.severity) {
        const success = await sendExpoNotification(
          [user.expo_token],
          analysis.title || "Weather Update",
          analysis.body || "Check current conditions.",
          { type: analysis.severity, weather_type: analysis.type, user_id: user.user_id, timestamp: new Date().toISOString() }
        );

        if (success) {
          userResult.status = "success";
          userResult.message = `Sent ${analysis.severity} successfully.`;
          userResult.alert_severity = analysis.severity;
          userResult.alert_title = analysis.title;
          userResult.alert_body = analysis.body;
          userResult.alert_type = analysis.type;
          if (analysis.severity === "alert") totalAlertsSent++;
          else totalNotificationsSent++;
          console.log(`${analysis.severity} sent to user ${user.user_id}: ${analysis.title}`);
        } else {
          userResult.message = `Failed to send ${analysis.severity} notification via Expo.`;
          console.error(`Failed to send ${analysis.severity} to user ${user.user_id}`);
          totalErrors++;
        }
      } else {
        userResult.status = "success";
        userResult.message = "No weather alert or notification deemed necessary.";
        console.log(`No alert/notification for user ${user.user_id}`);
      }
    } catch (userError: any) {
      userResult.message = `Error processing: ${userError.message || "Unknown error"}`;
      console.error(`Error processing user ${user.user_id}:`, userError.message);
      totalErrors++;
    } finally {
      allUserResults.push(userResult);
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log("Weather alert cron job finished processing users.");

  const overallResultsSummary = {
    processed: users.length,
    notifications_sent: totalNotificationsSent,
    alerts_sent: totalAlertsSent,
    errors: totalErrors,
  };

  console.log("Summary:", overallResultsSummary);

  const jobSuccess = totalErrors === 0 && users.length > 0;

  return new Response(
    JSON.stringify({
      success: jobSuccess,
      message: jobSuccess ? "Weather alert cron job completed successfully." : "Weather alert cron job completed with errors.",
      summary: overallResultsSummary,
      user_details: allUserResults,
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: jobSuccess ? 200 : 500,
    }
  );
});
