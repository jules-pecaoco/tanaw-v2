import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  confidence: number;
  type?: string;
  sub_type?: string;
  description?: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { expo_token, media_files, location }: HazardReport = await req.json();

    // Validate input
    if (!expo_token || !media_files || !location) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload media files to Supabase Storage
    const uploadedPaths: string[] = [];

    for (const mediaFile of media_files) {
      const fileName = `${Date.now()}-${mediaFile.name}`;
      const filePath = `reports/${fileName}`;

      // Convert base64 to blob if needed
      const response = await fetch(mediaFile.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage.from("hazard-media").upload(filePath, blob, {
        contentType: mediaFile.type === "image" ? "image/jpeg" : "video/mp4",
      });

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      uploadedPaths.push(data.path);
    }

    if (uploadedPaths.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to upload media files" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze media with LLM (using Ollama as free option)
    const analysis = await analyzeWithLLM(uploadedPaths, supabase);

    if (!analysis.is_hazard) {
      // Clean up uploaded files if not a hazard
      for (const path of uploadedPaths) {
        await supabase.storage.from("hazard-media").remove([path]);
      }

      return new Response(
        JSON.stringify({
          success: false,
          reason: analysis.reason || "The submitted content does not appear to be a hazard or natural disaster.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const { data, error } = await supabase
      .from("user_reports")
      .insert({
        expo_token,
        type: analysis.type || "unknown",
        sub_type: analysis.sub_type,
        description: analysis.description,
        media_path: uploadedPaths,
        location: `POINT(${location.longitude} ${location.latitude})`,
      })
      .select();

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Failed to save report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_id: data[0].id,
        message: "Hazard report submitted successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function analyzeWithLLM(mediaPaths: string[], supabase: any): Promise<LLMAnalysis> {
  try {
    // Using Ollama with llava model (free, local LLM with vision capabilities)
    // You'll need to set up Ollama server or use alternative free vision LLM

    // For now, using a simple heuristic + free vision API
    // Replace with actual LLM call
    const analysis = await callVisionLLM(mediaPaths, supabase);
    return analysis;
  } catch (error) {
    console.error("LLM analysis error:", error);
    // Fallback to manual review
    return {
      is_hazard: true, // Conservative approach - let humans review
      confidence: 0.5,
      type: "unknown",
      description: "Requires manual review",
    };
  }
}

async function callVisionLLM(mediaPaths: string[], supabase: any): Promise<LLMAnalysis> {
  // Using Hugging Face Inference API (free tier available)
  const HF_TOKEN = Deno.env.get("HUGGING_FACE_TOKEN"); // Free API key

  try {
    // Get first image for analysis
    const { data } = await supabase.storage.from("hazard-media").download(mediaPaths[0]);

    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Using BLIP-2 or similar free vision model
    const response = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large", {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: base64,
        parameters: {
          max_length: 100,
        },
      }),
    });

    const result = await response.json();
    const description = result[0]?.generated_text || "";

    // Simple keyword matching for hazard detection
    const hazardKeywords = [
      "flood",
      "flooding",
      "water damage",
      "storm",
      "hurricane",
      "tornado",
      "earthquake",
      "landslide",
      "fire",
      "wildfire",
      "smoke",
      "damage",
      "destruction",
      "emergency",
      "disaster",
      "debris",
      "collapsed",
      "broken",
      "dangerous",
      "hazard",
      "accident",
      "crash",
    ];

    const isHazard = hazardKeywords.some((keyword) => description.toLowerCase().includes(keyword));

    let type = "unknown";
    let subType = "";

    if (isHazard) {
      if (description.includes("flood") || description.includes("water")) {
        type = "flood";
        subType = "water_damage";
      } else if (description.includes("fire") || description.includes("smoke")) {
        type = "fire";
        subType = "wildfire";
      } else if (description.includes("storm") || description.includes("wind")) {
        type = "storm";
        subType = "wind_damage";
      } else if (description.includes("earthquake")) {
        type = "earthquake";
        subType = "structural_damage";
      }
    }

    return {
      is_hazard: isHazard,
      confidence: isHazard ? 0.8 : 0.2,
      type,
      sub_type: subType,
      description,
      reason: isHazard ? undefined : "The image does not show clear signs of a hazard or natural disaster.",
    };
  } catch (error) {
    console.error("Vision LLM error:", error);
    return {
      is_hazard: false,
      confidence: 0.1,
      reason: "Unable to analyze media content",
    };
  }
}
