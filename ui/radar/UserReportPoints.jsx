import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { memo, useMemo } from "react";

/**
 * Transforms the raw report data array into a GeoJSON FeatureCollection.
 */
const createGeoJSON = (reports) => ({
  type: "FeatureCollection",
  features: reports.map((report) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: report.coordinates,
    },
    properties: {
      id: report.id,
      category: report.type || "Other",
      raw: JSON.stringify(report),
    },
  })),
});

/**
 * Renders user-submitted reports on the map using a high-performance,
 * cluster-enabled ShapeSource with background circles for visibility.
 */
const UserReportPoints = ({ reports, onReportPress }) => {
  const geoJSON = useMemo(() => createGeoJSON(reports), [reports]);

  const handlePress = (event) => {
    const feature = event.features?.[0];
    if (feature && !feature.properties.cluster) {
      const rawReportData = JSON.parse(feature.properties.raw);
      onReportPress(rawReportData);
    }
  };

  return (
    <ShapeSource id="user-report-source" shape={geoJSON} cluster={true} clusterRadius={50} clusterMaxZoomLevel={13} onPress={handlePress}>
      {/* --- CLUSTER LAYERS --- */}
      {/* 1. Cluster background circle */}
      <CircleLayer
        id="report-cluster-circles"
        filter={["has", "point_count"]}
        style={{
          circleRadius: 20,
          circleColor: "#F47C25", // Your primary orange for clusters
          circleStrokeColor: "white",
          circleStrokeWidth: 2,
        }}
      />

      {/* 2. Cluster count number */}
      <SymbolLayer
        id="report-cluster-count"
        filter={["has", "point_count"]}
        style={{
          textField: ["get", "point_count"],
          textSize: 12,
          textColor: "white",
        }}
      />

      {/* --- UNCLUSTERED (INDIVIDUAL POINT) LAYERS --- */}
      {/* 3. NEW: Unclustered background circle */}
      <CircleLayer
        id="report-background-circle"
        filter={["!", ["has", "point_count"]]}
        style={{
          circleRadius: 18,
          circleColor: [
            "match",
            ["get", "category"],
            "Flood",
            "#2563eb", // Strong blue
            "Fire",
            "#dc2626", // Bold red
            "Landslide",
            "#92400e", // Earth brown
            "Accident",
            "#374151", // Dark gray
            "Earthquake",
            "#b45309", // Amber/Dark orange
            "Storm",
            "#6d28d9", // Deep purple
            "#9ca3af", // Default light gray
          ],
          circleStrokeColor: "white",
          circleStrokeWidth: 2,
        }}
      />

      {/* 4. Unclustered icon */}
      <SymbolLayer
        id="report-icons"
        filter={["!", ["has", "point_count"]]}
        style={{
          iconImage: [
            "match",
            ["get", "category"],
            "Flood",
            "Flood",
            "Fire",
            "Fire",
            "Landslide",
            "Landslide",
            "Accident",
            "Accident",
            "Earthquake",
            "Earthquake",
            "Storm",
            "Storm",
            "Other", // Fallback icon
          ],
          iconSize: 0.05, // Make icon slightly smaller to fit inside the circle
          iconAllowOverlap: true,
          iconAnchor: "center",
        }}
      />
    </ShapeSource>
  );
};

export default memo(UserReportPoints);
