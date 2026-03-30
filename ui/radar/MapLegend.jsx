import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

/**
 * Renders a legend for a single map layer.
 * It dynamically chooses between a categorical or gradient style based on the legend data.
 */
const LegendSection = ({ legendInfo }) => {
  // Case 1: Gradient Legend (for Heat Index, Rain)
  if (legendInfo.legend.type === "gradient") {
    const { title, stops } = legendInfo.legend;
    const gradientColors = stops.map((stop) => stop.color);

    return (
      <View>
        <Text className="text-xs font-bold text-gray-700">{title}</Text>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-3 w-full rounded-full my-1" />
        <View className="flex-row justify-between">
          {stops.map((stop, index) => (
            <Text key={index} className="text-xs text-gray-600">
              {stop.label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  // Case 2: Categorical Legend (for Flood, Landslide, Storm Surge)
  return (
    <View>
      <Text className="text-sm font-bold text-gray-800 mb-1">{legendInfo.layerName}</Text>
      {legendInfo.legend.map((item, index) => (
        <View key={index} className="flex-row items-center my-0.5">
          <View style={{ backgroundColor: item.color }} className="w-3.5 h-3.5 rounded-sm mr-2 border border-gray-400" />
          <Text className="text-xs text-gray-700">{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

/**
 * The main component that overlays the map and displays legends for all active layers.
 * @param {{ legends: Array<{ layerName: string, legend: object|Array }> }} props
 */
const MapLegend = ({ legends }) => {
  // If there are no active layers with legends, render nothing.
  if (!legends || legends.length === 0) {
    return null;
  }

  return (
    <View className="absolute top-0 left-0 w-full h-full pointer-events-none m-2">
      <View className="bg-white/80 rounded-lg p-2.5 w-[95%]">
        {legends.map((legendInfo, index) => (
          <View key={index} className={index > 0 ? "mt-2" : ""}>
            <LegendSection legendInfo={legendInfo} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default MapLegend;
