import { FillLayer, VectorSource } from "@rnmapbox/maps";
import { memo } from "react";

const HazardLayers = memo(({ id, vectorURL, fillLayerSourceID, style }) => {
  return (
    <VectorSource id={`${id}-source`} url={vectorURL}>
      <FillLayer id={`${id}-fill`} sourceLayerID={fillLayerSourceID} style={style} />
    </VectorSource>
  );
});

export default HazardLayers;
