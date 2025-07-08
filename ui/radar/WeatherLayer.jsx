import { RasterSource } from "@rnmapbox/maps";
import { memo } from "react";

const WeatherLayer = ({ id, tileUrlTemplates }) => {
  return <RasterSource id={id} tileUrlTemplates={[tileUrlTemplates]} tileSize={256}></RasterSource>;
};

export default memo(WeatherLayer);
