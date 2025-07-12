import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Import the Google AI SDK
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Interfaces ---
interface HazardReport {
  expo_token: string;
  media_files: Array<{
    uri: string;
    type: "image" | "video";
    name: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface LLMAnalysis {
  is_hazard: boolean;
  type?: string;
  sub_type?: string;
  description?: string;
  reason?: string;
}

// --- Main Server Logic ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { expo_token, media_files, location }: HazardReport = await req.json();

    if (!expo_token || !media_files || media_files.length === 0 || !location) {
      return new Response(JSON.stringify({ error: "Missing or invalid required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Media Upload & Preparation ---
    const uploadedPaths: string[] = [];
    const mediaForAnalysis: { mimeType: string; data: string }[] = [];

    for (const mediaFile of media_files) {
      if (mediaFile.type !== "image") continue; // Gemini Vision currently works best with images

      const response = await fetch(mediaFile.uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Prepare for LLM analysis first to avoid unnecessary uploads
      mediaForAnalysis.push({
        mimeType: blob.type || "image/jpeg",
        data: base64,
      });
    }

    if (mediaForAnalysis.length === 0) {
      return new Response(JSON.stringify({ error: "No valid images found for analysis." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- LLM Analysis ---
    const analysis = await analyzeMediaWithGemini(mediaForAnalysis);

    if (!analysis.is_hazard) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: analysis.reason || "The submitted media does not appear to contain a hazard.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Media Upload (only if it's a confirmed hazard) ---
    for (const mediaFile of media_files) {
      if (mediaFile.type !== "image") continue;

      const response = await fetch(mediaFile.uri);
      const blob = await response.blob();

      const fileName = `${crypto.randomUUID()}-${mediaFile.name}`;
      const filePath = `reports/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from("hazard-media").upload(filePath, blob, {
        contentType: blob.type || "image/jpeg",
      });

      if (uploadError) {
        console.error("Upload error after confirmation:", uploadError.message);
        continue;
      }
      uploadedPaths.push(uploadData.path);
    }

    if (uploadedPaths.length === 0) {
      return new Response(JSON.stringify({ error: "Hazard detected, but media upload failed." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: insertData, error: insertError } = await supabase
      .from("user_reports")
      .insert({
        expo_token: expo_token,
        type: analysis.type || "general_hazard",
        sub_type: analysis.sub_type,
        description: analysis.description,
        media_path: uploadedPaths,
        location: `POINT(${location.longitude} ${location.latitude})`,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      await supabase.storage.from("hazard-media").remove(uploadedPaths);
      return new Response(JSON.stringify({ error: "Failed to save the report to the database", insertError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_id: insertData.id,
        message: "Hazard report submitted successfully.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Gemini Analysis Function ---
async function analyzeMediaWithGemini(media: { mimeType: string; data: string }[]): Promise<LLMAnalysis> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return { is_hazard: false, reason: "Server configuration error." };
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: {
      response_mime_type: "application/json",
    },
  });

  const prompt = `
    You are an expert hazard analysis AI for a community safety program. Analyze the following image(s) to identify potential hazards or natural disasters that could cause human harm.

    Respond ONLY with a valid JSON object based on the following schema.
    {
      "is_hazard": boolean,
      "type": "Flood" | "Fire" | "Storm" | "Earthquake" | "Landslide" | "Accident" | "Other" | null,
      "sub_type": "flash_flood" | "wildfire" | "structural_damage" | "vehicle_crash" | "power_line_down" | "road_blockage" | string | null,
      "description": "A brief, human-like description from the perspective of a concerned community member. Example: 'It looks like the heavy rain caused flash flooding on Main Street by the bridge. The road is completely underwater and unsafe for cars.'" | null,
      "reason": "If 'is_hazard' is false, provide a brief reason why." | null
    }

    Analyze the image(s) and return the JSON.
  `;

  try {
    const imageParts = media.map((m) => ({
      inlineData: {
        data: m.data,
        mimeType: m.mimeType,
      },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    const responseText = response.text();

    // The response should be a clean JSON string because of response_mime_type
    const parsedAnalysis: LLMAnalysis = JSON.parse(responseText);
    return parsedAnalysis;
  } catch (error) {
    console.error("Gemini API or JSON parsing error:", error);
    return {
      is_hazard: false,
      reason: "Failed to analyze media due to a technical issue. Please review manually.",
    };
  }
}
