import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { memo, useMemo } from "react";

import useStore from "../../hooks/useStore";

const createGeoJSON = (datas) => ({
  type: "FeatureCollection",
  features: datas.map((item) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [item.longitude, item.latitude],
    },
    properties: {
      id: item.name,
      category: item.category,
      raw: JSON.stringify(item),
    },
  })),
});

const FacilityPointsLayer = ({ datas, open }) => {
  const { setFacilityBottomSheetData } = useStore();

  const geoJSON = useMemo(() => createGeoJSON(datas), [datas]);

  const handlePress = (event) => {
    const feature = event.features?.[0];
    if (!feature.properties.cluster) {
      const raw = JSON.parse(feature.properties.raw);
      setFacilityBottomSheetData(raw);
      open();
    }
  };


  return (
    <ShapeSource id="facility-source" shape={geoJSON} cluster={true} clusterRadius={50} clusterMaxZoomLevel={13} onPress={handlePress}>
      {/* Cluster background */}
      <CircleLayer
        id="cluster-circles"
        filter={["has", "point_count"]}
        style={{
          circleRadius: 20,
          circleColor: "#FF5722",
          circleStrokeColor: "#fff",
          circleStrokeWidth: 2,
        }}
      />

      {/* Cluster count */}
      <SymbolLayer
        id="cluster-count"
        filter={["has", "point_count"]}
        style={{
          textField: ["get", "point_count"],
          textSize: 12,
          textColor: "#fff",
          textIgnorePlacement: true,
          textAllowOverlap: true,
        }}
      />

      {/* Unclustered background */}
      <CircleLayer
        id="facility-background"
        filter={["!", ["has", "point_count"]]}
        style={{
          circleRadius: 20,
          circleColor: ["match", ["get", "category"], "hospital", "#f87171", "fire_station", "#facc15", "evac_site", "#60a5fa", "#9ca3af"],
          circleStrokeColor: "#fff",
          circleStrokeWidth: 2,
        }}
      />

      {/* Unclustered icons */}
      <SymbolLayer
        id="facility-icons"
        filter={["!", ["has", "point_count"]]}
        style={{
          iconImage: ["get", "category"],
          iconSize: 0.6,
          iconAllowOverlap: true,
          iconAnchor: "center",
        }}
      />
    </ShapeSource>
  );
};

export default memo(FacilityPointsLayer);
