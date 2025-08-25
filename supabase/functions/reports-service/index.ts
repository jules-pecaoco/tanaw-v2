import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendExpoNotification } from "./_shared/expoPush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface HazardReport {
  expo_token: string;
  media_files: Array<{ uri: string; type: "image" | "video"; name: string }>;
  location: { latitude: number; longitude: number };
}

interface LLMAnalysis {
  is_hazard: boolean;
  type?: string;
  sub_type?: string;
  description?: string;
  reason?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  error_code: string;
  details?: any;
  timestamp: string;
}

interface SuccessResponse {
  success: true;
  report_id: string;
  message: string;
  timestamp: string;
  warnings?: {
    uploadErrors?: string[];
    mediaProcessingErrors?: string[];
  };
}

function createErrorResponse(error: string, errorCode: string, details?: any): ErrorResponse {
  return {
    success: false,
    error,
    error_code: errorCode,
    details,
    timestamp: new Date().toISOString(),
  };
}

function createSuccessResponse(reportId: string, message: string): SuccessResponse {
  return {
    success: true,
    report_id: reportId,
    message,
    timestamp: new Date().toISOString(),
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), "");
  return btoa(binary);
}

async function reverseGeocode(location: { latitude: number; longitude: number }) {
  const { latitude, longitude } = location;
  const MAPBOX_API_KEY = Deno.env.get("MAPBOX_API_KEY");

  if (!MAPBOX_API_KEY) {
    return {
      success: false,
      error: "Missing MAPBOX_API_KEY",
      code: "CONFIG_ERROR",
    };
  }

  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      access_token: MAPBOX_API_KEY,
    });

    const apiUrl = `https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `Mapbox API responded with status ${response.status}`,
        code: "MAPBOX_API_ERROR",
      };
    }

    const data = await response.json();
    const context = data.features?.[0]?.properties?.context;

    if (!context) {
      return {
        success: false,
        error: "No geocoding context returned from Mapbox",
        code: "MAPBOX_NO_CONTEXT",
      };
    }

    return {
      success: true,
      locality: context.locality?.name || null,
      city: context.place?.name || null,
      region: context.region?.name || null,
    };
  } catch (err) {
    return {
      success: false,
      error: `Exception during reverse geocoding: ${err.message}`,
      code: "REVERSE_GEOCODE_EXCEPTION",
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify(createErrorResponse("Missing Supabase credentials", "CONFIG_ERROR")), { status: 500, headers: corsHeaders });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify(createErrorResponse("Invalid JSON", "PARSE_ERROR", { parseError: parseError.message })), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { user_id, expo_token, media_files, location } = requestBody;

    if (!expo_token || !media_files?.length || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
      return new Response(JSON.stringify(createErrorResponse("Missing required fields", "VALIDATION_ERROR")), { status: 400, headers: corsHeaders });
    }

    const uploadedPaths = [];
    const mediaForAnalysis = [];
    const mediaProcessingErrors = [];

    for (let i = 0; i < media_files.length; i++) {
      const mediaFile = media_files[i];

      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("hazard-media")
          .createSignedUrl(`tmp/${mediaFile.name}`, 60);
        if (signedUrlError || !signedUrlData) {
          mediaProcessingErrors.push(`File ${mediaFile.name}: Failed to generate signed URL.`);
          continue;
        }

        const head = await fetch(signedUrlData.signedUrl, { method: "HEAD" });
        if (!head.ok) {
          mediaProcessingErrors.push(`File ${mediaFile.name}: File does not exist.`);
          continue;
        }

        const response = await fetch(signedUrlData.signedUrl);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);

        mediaForAnalysis.push({ mimeType: blob.type || (mediaFile.type === "video" ? "video/mp4" : "image/jpeg"), data: base64 });
      } catch (error) {
        mediaProcessingErrors.push(`File ${mediaFile.name}: ${error.message}`);
      }
    }

    if (!mediaForAnalysis.length) {
      return new Response(JSON.stringify(createErrorResponse("No valid media for analysis", "MEDIA_PROCESSING_ERROR", { mediaProcessingErrors })), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let analysis;
    try {
      analysis = await analyzeMediaWithGemini(mediaForAnalysis);
    } catch (analysisError) {
      return new Response(JSON.stringify(createErrorResponse("Failed AI analysis", "AI_ANALYSIS_ERROR", { error: analysisError.message })), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!analysis.is_hazard) {
      const failReason = analysis.reason?.trim();

      return new Response(
        JSON.stringify({
          success: false,
          reason: failReason || "No visible real-world hazard detected, or media may be digitally sourced.",
          analysis_details: analysis,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const uploadErrors = [];
    for (const mediaFile of media_files) {
      const tmpPath = `tmp/${mediaFile.name}`;
      const finalPath = `reports/${mediaFile.name}`;

      try {
        const { error: moveError } = await supabase.storage.from("hazard-media").move(tmpPath, finalPath);
        if (moveError) {
          uploadErrors.push(`Failed to move ${tmpPath}: ${moveError.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from("hazard-media").getPublicUrl(finalPath);
        uploadedPaths.push(publicUrlData.publicUrl);
      } catch (err) {
        uploadErrors.push(`Failed to move ${tmpPath}: ${err.message}`);
      }
    }

    if (!uploadedPaths.length) {
      return new Response(JSON.stringify(createErrorResponse("Hazard detected but upload failed", "UPLOAD_ERROR", { uploadErrors, analysis })), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const locationName = await reverseGeocode(location);

    const { data: insertData, error: insertError } = await supabase
      .from("user_reports")
      .insert({
        user_id,
        expo_token,
        type: analysis.type || "general_hazard",
        sub_type: analysis.sub_type,
        description: analysis.description,
        media_path: uploadedPaths,
        location: `POINT(${location.longitude} ${location.latitude})`,
        location_name: locationName ? `${locationName.locality}, ${locationName.city}` : "Unknown Location",
      })
      .select("user_id")
      .single();

    if (insertError) {
      await supabase.storage
        .from("hazard-media")
        .remove(uploadedPaths)
        .catch(() => {});
      return new Response(
        JSON.stringify(createErrorResponse("Failed DB insert", "DATABASE_ERROR", { insertError: insertError.message, uploadedPaths })),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const { data: existing } = await supabase
      .from("advisories")
      .select("id, title, description")
      .eq("source", "user_report")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    const isSimilar = existing?.some((entry) => {
      return entry.title === `Nearby ${analysis.type} Reported`;
    });

    if (isSimilar) {
      return new Response(
        JSON.stringify({ success: true, message: "Report submitted but similar report already exists recently. Will Skip Alert Until 10 Minutes" }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    const { data: users } = await supabase.rpc("get_nearby_users_with_token", {
      report_location: `POINT(${location.longitude} ${location.latitude})`,
      radius_km: 5,
    });

    const title = `Nearby ${analysis.type} Reported`;
    const body = analysis.description;
    const id = insertData.user_id + "-" + Math.random().toString(36).substring(2, 15);

    const tokens = users.map((u) => u.expo_token).filter(Boolean);
    await sendExpoNotification(tokens, title, body, { type: "alert", hazard: analysis.type.toLowerCase(), id });

    await supabase.from("advisories").insert({
      type: "alert",
      title,
      description: body,
      source: "user_report",
      location: `POINT(${location.longitude} ${location.latitude})`,
    });

    const response = createSuccessResponse(insertData.user_id, "Hazard report submitted successfully");
    if (uploadErrors.length || mediaProcessingErrors.length) {
      response.warnings = {
        uploadErrors: uploadErrors.length ? uploadErrors : undefined,
        mediaProcessingErrors: mediaProcessingErrors.length ? mediaProcessingErrors : undefined,
      };
    }

    return new Response(JSON.stringify(response), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify(createErrorResponse("Internal server error", "INTERNAL_ERROR", { error: error.message, stack: error.stack })),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

async function analyzeMediaWithGemini(media: { mimeType: string; data: string }[]): Promise<LLMAnalysis> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: { response_mime_type: "application/json" },
  });

  const prompt = `
You are an expert hazard analysis AI for a real-time disaster reporting app.
Analyze the submitted media (images) to detect real-world hazards (e.g., floods, fires, landslides, accidents).
Also watch for signs of digital content (TVs, screenshots, social media, artificial graphics, memes, etc.) that maybe taken from laptops, projector, and digital medium other than real world scenario
Reject if multiple existence of similar images are detected.


Respond ONLY in this JSON format:
{
  "is_hazard": boolean,
  "type": "Flood" | "Fire" | "Storm" | "Earthquake" | "Landslide" | "Accident" | "Other" | null,
  "sub_type": "flash_flood" | "wildfire" | "structural_damage" | "vehicle_crash" | "power_line_down" | "road_blockage" | string | null,
  "description": string | null,
  "reason": string | null
}
If you're unsure, lean toward caution and explain why.
`;

  const imageParts = media.map((m) => ({ inlineData: { data: m.data, mimeType: m.mimeType } }));
  const result = await model.generateContent([prompt, ...imageParts]);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText);
  } catch (err) {
    throw new Error(`Failed to parse Gemini response: ${responseText}`);
  }
}
