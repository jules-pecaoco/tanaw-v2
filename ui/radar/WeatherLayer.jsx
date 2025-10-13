import { RasterLayer, RasterSource } from "@rnmapbox/maps";

const WeatherLayer = ({ id, maxZoomLevel, tileUrlTemplates, layer }) => {
  const key = `${id}-${tileUrlTemplates}`;

  const ANCHOR_LAYER_ID = "settlement-label";

  return (
    <RasterSource maxZoomLevel={maxZoomLevel} id={`weather-source-${key}`} tileUrlTemplates={[tileUrlTemplates]} tileSize={256}>
      <RasterLayer belowLayerID={ANCHOR_LAYER_ID} id={`weather-layer-${key}`} />
    </RasterSource>
  );
};

export default WeatherLayer;
