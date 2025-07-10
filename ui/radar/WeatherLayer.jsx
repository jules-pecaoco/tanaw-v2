import { RasterLayer, RasterSource } from "@rnmapbox/maps";

const WeatherLayer = ({ id, maxZoomLevel, tileUrlTemplates, layer }) => {
  const key = `${id}-${tileUrlTemplates}`;

  return (
    <RasterSource maxZoomLevel={maxZoomLevel} id={`weather-source-${key}`} tileUrlTemplates={[tileUrlTemplates]} tileSize={256}>
      <RasterLayer belowLayerID="building" id={`weather-layer-${key}`} />
    </RasterSource>
  );
};

export default WeatherLayer;
