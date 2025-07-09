const buildFillColorExpression = (style) => {
  const flattenedStops = style.stops.flat();
  return ["interpolate", ["linear"], ["get", style.property], ...flattenedStops];
};

/**
 * Parses the layer configuration to extract properties for rendering.
 * @param {Object} style - The style configuration for the layer.
 * @returns {Object} An object containing fillColor and fillOpacity properties.
 */
const parseLayerConfigToProps = (style) => {
  return {
    fillColor: buildFillColorExpression(style),
    fillOpacity: style.opacity,
  };
};

export { parseLayerConfigToProps };
