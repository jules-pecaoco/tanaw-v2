import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";

// Hazard type color mapping
const getHazardColor = (type) => {
  const colors = {
    Flood: { bg: "bg-blue-100", text: "text-blue-800" },
    Fire: { bg: "bg-red-100", text: "text-red-800" },
    Storm: { bg: "bg-purple-100", text: "text-purple-800" },
    Earthquake: { bg: "bg-amber-100", text: "text-amber-800" },
    Landslide: { bg: "bg-orange-100", text: "text-orange-800" },
    Accident: { bg: "bg-yellow-100", text: "text-yellow-800" },
    Other: { bg: "bg-gray-100", text: "text-gray-800" },
  };

  return colors[type] || colors.Other;
};

const ReportCard = ({ item }) => {
  const media = item.media_path || [];
  const hazardColors = getHazardColor(item.type);

  return (
    <View className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md">
      {/* Media Container */}
      <View className="w-full aspect-video bg-background">
        <ScrollView horizontal>
          {media.map((uri, index) => (
            <View key={index} className="m-2 aspect-video">
              <Image source={{ uri: uri }} contentFit="cover" style={{ aspectRatio: 16 / 9 }} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Content Container */}
      <View className="p-4">
        <Text className="text-base text-gray-800 mb-2 text-justify">{item.description}</Text>

        <View className="flex-row flex-wrap mb-2 items-center justify-between">
          <View className="flex-row flex-wrap items-center">
            <Text className={`${hazardColors.bg} ${hazardColors.text} rounded-full px-3 py-1 text-xs font-semibold mr-2 mb-2 capitalize`}>
              {item.type}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 text-right">{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text className="text-xs text-gray-500 text-right">{item.location_name}</Text>
      </View>
    </View>
  );
};

export default ReportCard;
