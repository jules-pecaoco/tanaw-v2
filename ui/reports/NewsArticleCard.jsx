import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Text, TouchableOpacity, View } from "react-native";

const NewsArticleCard = ({ item }) => {
  const handlePress = () => {
    if (item.link) {
      WebBrowser.openBrowserAsync(item.link);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md active:opacity-80">
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          // Per your request, using inline styles for the image component
          style={{ width: "100%", height: 200 }}
          placeholder={{ blurhash: "L6Pj0^i_.AyE_3t7t7R**0o#DgR4" }}
          transition={300}
        />
      )}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-2 text-justify">{item.title}</Text>
        <Text className="text-base text-gray-700 mb-3 text-justify">{item.summary}</Text>
        <View className="flex-row justify-between items-center">
          <Text className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getSeverityClass(item.severity)}`}>{item.severity}</Text>
          <Text className="text-xs text-gray-500">{new Date(item.published_date).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NewsArticleCard;