import { FillLayer, VectorSource } from "@rnmapbox/maps";
import { memo } from "react";

const HazardLayers = ({ id, url, sourceLayerID, style }) => {
  return (
    <VectorSource id={id} url={url}>
      <FillLayer belowLayerID="building" id={id} sourceLayerID={sourceLayerID} style={style} />
    </VectorSource>
  );
};

export default memo(HazardLayers);
