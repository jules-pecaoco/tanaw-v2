import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const hazardLayersData = {
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
            id: "flood_100year",
            name: "Flood Prone Areas",
            tilesetUrl: "mapbox://jules-pecaoco-dev.4p3rwjm0",
            sourceLayer: "flood_100year",
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
            legend: [
              { color: "#b047ff", label: "Low Hazard" },
              { color: "#5a00ff", label: "Medium Hazard" },
              { color: "#002474", label: "High Hazard" },
            ],
          },
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
            legend: [
              { color: "#ff0000", label: "High Susceptibility" },
              { color: "#FFA500", label: "Moderate Susceptibility" },
              { color: "#FF4500", label: "Low Susceptibility" },
            ],
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
            name: "Advisory 1",
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
            legend: [
              { color: "#e3d1ff", label: "Low Hazard" },
              { color: "#b047ff", label: "Medium Hazard" },
              { color: "#5a00ff", label: "High Hazard" },
            ],
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
            legend: [
              { color: "#e3d1ff", label: "Low Hazard" },
              { color: "#b047ff", label: "Medium Hazard" },
              { color: "#5a00ff", label: "High Hazard" },
            ],
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
            legend: [
              { color: "#e3d1ff", label: "Low Hazard" },
              { color: "#b047ff", label: "Medium Hazard" },
              { color: "#5a00ff", label: "High Hazard" },
            ],
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
            legend: [
              { color: "#e3d1ff", label: "Low Hazard" },
              { color: "#b047ff", label: "Medium Hazard" },
              { color: "#5a00ff", label: "High Hazard" },
            ],
          },
        ],
      },
    ],
  },
};

Deno.serve(async (_req) => {
  try {
    return new Response(JSON.stringify(hazardLayersData), {
      headers: {
        "Content-Type": "application/json",
        // Best practice: Add CORS headers to allow requests from your web/mobile app
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
