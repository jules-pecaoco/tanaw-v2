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

    try {
      const { data: users, error: rpcError } = await supabase.rpc("get_nearby_users_with_token", {
        report_location: `POINT(${location.longitude} ${location.latitude})`,
        radius_km: 5,
        reporter_token: expo_token,
      });

      // Add logging to see what the RPC function returns
      console.log("Result from get_nearby_users_with_token:", { users, rpcError });

      if (rpcError) {
        throw new Error(`RPC Error: ${rpcError.message}`);
      }

      // Gracefully handle if no users are found
      if (users && users.length > 0) {
        const title = `Nearby ${analysis.type} Reported`;
        const body = analysis.description;
        const id = insertData.user_id + "-" + Math.random().toString(36).substring(2, 15);

        const tokens = users.map((u) => u.expo_token).filter(Boolean);

        if (tokens.length > 0) {
          await sendExpoNotification(tokens, title, body, { type: "alert", hazard: analysis.type.toLowerCase(), id });
        }

        await supabase.from("advisories").insert({
          type: "alert",
          title,
          description: body,
          source: "user_report",
          location: `POINT(${location.longitude} ${location.latitude})`,
        });
      }
    } catch (notificationError) {
      // Log the error for your own debugging purposes
      console.error("Failed to send notifications or create advisory, but report was saved.", {
        reportId: insertData.user_id,
        error: notificationError.message,
      });
      // Don't re-throw the error. The function will continue and return success.
    }
    // --- End of new, resilient block ---

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
    model: "gemini-2.5-flash-lite",
    generationConfig: { response_mime_type: "application/json" },
  });

  //   const prompt = `
  // You are a sophisticated AI image analysis engine for a public safety and hazard reporting application. Your primary goal is to validate user-submitted images to ensure they depict a genuine, real-world hazard and are not fraudulent or misinformative.

  // Analyze the provided images as a single, cohesive report based on the following strict rules:

  // 1.  **Real-World Verification:** The images MUST depict a scene from the real, physical world.

  // 2.  **Digital Content Rejection:** IMMEDIATELY REJECT the report if you detect any signs that the images are of a digital screen (computer monitor, laptop, TV, phone), a screenshot, or contain artificial graphics. The content must be an original photograph of a real event.

  // 3.  **Image Uniqueness and Redundancy:** ANALYZE the images for redundancy. REJECT the report if the images are identical or near-identical duplicates. If the images show the same scene from slightly different angles, this is acceptable and should be used for a more confident analysis. However, if they are exact copies, it indicates a low-quality report.

  // 4.  **Hazard Identification:** If, and only if, the images pass all the above checks, identify the primary hazard (e.g., Flood, Fire, Landslide, Accident).

  // Based on your analysis, respond ONLY in the following JSON format. Do not include any other text or explanations outside the JSON structure.

  // {
  //   "is_hazard": boolean,
  //   "type": "Flood" | "Fire" | "Storm" | "Earthquake" | "Landslide" | "Accident" | "Other" | null,
  //   "sub_type": "flash_flood" | "wildfire" | "structural_damage" | "vehicle_crash" | "power_line_down" | "road_blockage" | string | null,
  //   "description": "A concise, one-sentence summary of the hazard observed." | null,
  //   "reason": "If is_hazard is false, provide a clear, brief reason based on the rules above (e.g., 'Detected digital screen content.', 'Submission contains duplicate images.', or 'No discernible hazard found.')." | null
  // }
  // `;

  const prompt = `
You are a sophisticated AI image analysis engine for a public safety and hazard reporting application. Your primary goal is to validate user-submitted images to ensure they depict a genuine, real-world hazard or a reasonable digital sample for testing.

Analyze the provided images as a single, cohesive report based on the following guidelines:

1.  **Real-World Verification:** Prefer images that depict real-world scenes or genuine photographs. However, allow digital images (e.g., photos of a computer screen or rendered samples) *if they are clearly being used for demonstration, testing, or sample purposes related to hazard awareness.*

2.  **Digital Content Handling:** 
    - Accept digital or on-screen images *only if they plausibly show a hazard example or serve a demonstrative purpose.*
    - Reject the report only if the images are purely artificial, unrelated to hazards, or contain clear synthetic/AI-generated graphics without educational or demonstrative intent.

3.  **Image Uniqueness and Redundancy:** Analyze the images for redundancy. Reject the report if the images are identical or near-identical duplicates. If they show the same hazard scene or sample from slightly different angles or contexts, this is acceptable.

4.  **Hazard Identification:** If the images are valid (either real-world or legitimate digital samples), identify the primary hazard (e.g., Flood, Fire, Landslide, Accident).

Based on your analysis, respond ONLY in the following JSON format. Do not include any other text or explanations outside the JSON structure.

{
  "is_hazard": boolean,
  "type": "Flood" | "Fire" | "Storm" | "Earthquake" | "Landslide" | "Accident" | "Other" | null,
  "sub_type": "flash_flood" | "wildfire" | "structural_damage" | "vehicle_crash" | "power_line_down" | "road_blockage" | string | null,
  "description": "A concise, one-sentence summary of the hazard or demonstration observed." | null,
  "reason": "If is_hazard is false, provide a clear, brief reason based on the rules above (e.g., 'Unrelated or synthetic image.', 'Duplicate submission.', or 'No discernible hazard found.')." | null
}
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
