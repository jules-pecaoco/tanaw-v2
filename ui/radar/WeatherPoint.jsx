// components/WeatherPoint.jsx
import { MarkerView } from "@rnmapbox/maps";
import { Text, View } from "react-native";

const getHeatColor = (heatIndex) => {
  if (heatIndex >= 52) return "bg-[#CC0001]";
  if (heatIndex >= 42) return "bg-[#FF6600]";
  if (heatIndex >= 33) return "bg-[#FFCC00]";
  if (heatIndex >= 27) return "bg-[#FFFF00]";

  return "bg-[#E6E6E6]";
};

const WeatherPoint = ({ data }) => {
  if (!data) {
    return null;
  }

  const { lat = 0, lon = 0, heat_index = 0, name = "Unknown" } = data;

  if (typeof lat !== "number" || typeof lon !== "number") {
    console.error("Invalid coordinates for WeatherPoint:", data);
    return null;
  }

  return (
    <MarkerView coordinate={[lon, lat]} anchor={{ x: 0.5, y: 0.5 }} id={name}>
      <View className={`flex items-center justify-center`}>
        <Text className="text-xs font-tbold text-secondary text-center mb-0.5" numberOfLines={1}>
          {name}
        </Text>
        <View className={`w-8 h-8 rounded-full items-center justify-center border-2 border-secondary ${getHeatColor(heat_index)}`}>
          <Text className={`text-sm font-tbold rounded-full text-secondary text-center ${getHeatColor(heat_index)}`}>{Math.round(heat_index)}°</Text>
        </View>
      </View>
    </MarkerView>
  );
};

export default WeatherPoint;
