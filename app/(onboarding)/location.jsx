import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import useLocation from "../../hooks/useLocation";
import useStore from "../../hooks/useStore";

const Location = () => {
  const { requestLocationPermission, isRequestingLocation } = useLocation();
  const { setUserLocation } = useStore();

  const handleLocationPermission = async () => {
    try {
      const coordinates = await requestLocationPermission();
      setUserLocation(coordinates);
    } catch (error) {
    }

    router.push("notification");
  };

  return (
    <View className="flex-1 items-center justify-center bg-secondary">
      <LinearGradient locations={[0.0, 0.5]} colors={["#E84E4C", "#3c454c"]} className="h-full w-full">
        <View className="flex-1 items-center justify-end h-full w-full pb-20">
          <Ionicons name="location-outline" size={120} color="#fffcfa" />
          <Text className="font-tbold text-gray-400 text-center mt-10">LOCATION PERMISSION</Text>
          <Text className="font-tbold text-gray-300 text-center text-3xl mx-12 mt-5">Enable Location for Hyper-Local Updates</Text>
          <Text className="font-tregular text-gray-400 text-center mx-12 mt-5">
            We need your location to provide accurate, real-time updates for your area. From monitoring current conditions to alerting you about risks
            nearby.
          </Text>
          <View className="my-8"></View>
          <View className="h-fit w-[70%]">
            <TouchableOpacity
              className={`bg-white text-center py-3 rounded-full font-rsemibold ${isRequestingLocation ? "opacity-70" : ""}`}
              onPress={handleLocationPermission}
              disabled={isRequestingLocation}
            >
              {isRequestingLocation ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#000" />
                  <Text className="text-center ml-2">Getting Location...</Text>
                </View>
              ) : (
                <Text className="text-center">Allow Access Location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default Location;
