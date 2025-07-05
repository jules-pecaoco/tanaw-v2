import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

function Notification() {
  return (
    <View className="flex-1 items-center justify-center bg-secondary">
      <LinearGradient locations={[0.0, 0.5]} colors={["#F47C25", "#3c454c"]} className="h-full w-full">
        <View className="flex-1 items-center justify-end h-full w-full pb-20">
          <Ionicons name="notifications-outline" size={120} color="#fffcfa" />
          <Text className="font-tbold text-gray-400 text-center mt-10">NOTIFICATION PERMISSION</Text>
          <Text className="font-tbold text-gray-300 text-center text-3xl mx-20 mt-5">Turn On Notifications for Alerts</Text>
          <Text className="font-tregular text-gray-400 text-center mx-12 mt-5">
            Turn on notifications to stay informed about important updates, whether it’s changes in local conditions or urgent alerts.
          </Text>
          <View className="my-8"></View>
          <View className="h-fit w-[70%]">
            <TouchableOpacity
              className="bg-white text-center py-3 rounded-full font-rsemibold"
              onPress={() => {
                router.replace("radar");
              }}
            >
              <Text className="text-center">Allow Access Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default Notification;
