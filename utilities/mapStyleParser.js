const buildFillColorExpression = (style) => {
  const flattenedStops = style.stops.flat();
  return ["interpolate", ["linear"], ["get", style.property], ...flattenedStops];
};

const parseLayerConfigToProps = (style) => {
  return {
    fillColor: buildFillColorExpression(style),
    fillOpacity: style.opacity,
  };
};

export default parseLayerConfigToProps;
