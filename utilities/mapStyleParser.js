const buildFillColorExpression = (style) => {
  if (!style || !style.stops) return "blue"; // Default color

  const stops = style.stops.flatMap((stop) => [stop.value, stop.color]);
  return ["interpolate", ["linear"], ["get", style.property], ...stops];
};

const parseLayerConfigToProps = (layer) => {
  return {
    id: layer.id,
    vectorURL: layer.tilesetUrl,
    fillLayerSourceID: layer.sourceLayer,
    style: {
      fillColor: buildFillColorExpression(layer.style),
      fillOpacity: layer.style.opacity,
    },
  };
};

export default parseLayerConfigToProps
