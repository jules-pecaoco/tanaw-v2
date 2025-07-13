// components/WeatherPointsLayer.jsx
import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useMemo } from "react";

const getHeatColor = (heatIndex) => {
  if (heatIndex >= 52) return "#CC0001"; // Extreme heat
  if (heatIndex >= 42) return "#FF6600"; // Very hot
  if (heatIndex >= 33) return "#FFCC00"; // Warm
  if (heatIndex >= 27) return "#FFFF00"; // Mild
  return "#E6E6E6"; // Cool
};

const createGeoJSON = (datas) => ({
  type: "FeatureCollection",
  features: datas.map((item) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [item.lon, item.lat],
    },
    properties: {
      id: item.name,
      name: item.name,
      heat_index: item.heat_index,
      color: getHeatColor(item.heat_index),
    },
  })),
});

const WeatherPointsLayer = ({ datas }) => {
  const geoJSON = useMemo(() => createGeoJSON(datas), [datas]);

  return (
    <ShapeSource id="weather-points" shape={geoJSON}>
      {/* Colored background circle based on heat */}
      <CircleLayer
        id="weather-point-bg"
        style={{
          circleRadius: 16,
          circleColor: ["get", "color"],
          circleStrokeColor: "#555",
          circleStrokeWidth: 2,
        }}
      />

      {/* Temperature text inside circle */}
      <SymbolLayer
        id="weather-point-temp"
        style={{
          textField: ["concat", ["to-string", ["round", ["get", "heat_index"]]], "°"],
          textSize: 12,
          textColor: "#333",
          textAllowOverlap: true,
          textIgnorePlacement: true,
          textFont: ["Open Sans Bold", "Arial Unicode MS Bold"],
        }}
      />

      <SymbolLayer
        id="weather-point-name"
        style={{
          textField: ["get", "name"],
          textSize: 10,
          textColor: "#666",
          textOffset: [0, -2],
          textAnchor: "bottom",
          textAllowOverlap: false,
          textFont: ["Open Sans Regular", "Arial Unicode MS Regular"],
        }}
      />
    </ShapeSource>
  );
};

export default WeatherPointsLayer;
