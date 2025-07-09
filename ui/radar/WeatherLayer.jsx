import { RasterLayer, RasterSource } from "@rnmapbox/maps";

const WeatherLayer = ({ id, maxZoomLevel, tileUrlTemplates }) => {
  const key = `${id}-${tileUrlTemplates}`;

  return (
    <RasterSource maxZoomLevel={maxZoomLevel} id={`weather-source-${key}`} tileUrlTemplates={[tileUrlTemplates]} tileSize={256}>
      <RasterLayer id={`weather-layer-${key}`} />
    </RasterSource>
  );
};

export default WeatherLayer;
