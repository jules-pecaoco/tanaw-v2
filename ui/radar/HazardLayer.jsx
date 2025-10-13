import { FillLayer, VectorSource } from "@rnmapbox/maps";
import { memo } from "react";

const ANCHOR_LAYER_ID = "settlement-label";

const HazardLayers = ({ id, url, sourceLayerID, style }) => {
  return (
    <VectorSource id={id} url={url}>
      <FillLayer belowLayerID={ANCHOR_LAYER_ID} id={id} sourceLayerID={sourceLayerID} style={style} />
    </VectorSource>
  );
};

export default memo(HazardLayers);
