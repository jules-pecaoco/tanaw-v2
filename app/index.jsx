import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-red-100">
      <Text className="text-red-500">This is Index</Text>
      <TouchableOpacity
        className="bg-red-500 p-4 rounded-full mt-4"
        onPress={() => {
          router.replace("/radar");
        }}
      ></TouchableOpacity>
    </View>
  );
}

export default Index;
