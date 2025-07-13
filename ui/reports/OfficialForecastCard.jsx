import { Text, View } from "react-native";

const OfficialForecastCard = ({ item }) => {
  return (
    <View className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md border-l-4 border-blue-600">
      <View className="p-4">
        <Text className="text-lg font-bold text-blue-800 mb-2">{item.cause}</Text>
        <Text className="text-base text-gray-800 mb-3 font-semibold">{item.potential_impacts}</Text>
        <View className="mb-3">
          <Text className="text-sm text-gray-500 mb-1">Affected Areas:</Text>
          <Text className="text-sm text-gray-700">{item.affected_areas.join(", ")}</Text>
        </View>
        <View>
          <Text className="text-sm text-gray-500 mb-1">Recommendations:</Text>
          {item.recommendations.map((rec, index) => (
            <Text key={index} className="text-sm text-gray-700 ml-2">
              {" "}
              • {rec}
            </Text>
          ))}
        </View>
        <Text className="text-xs text-gray-400 text-right mt-3">PAGASA Forecast</Text>
      </View>
    </View>
  );
};

export default OfficialForecastCard;