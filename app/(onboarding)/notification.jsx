import Ionicons from "@expo/vector-icons/Ionicons";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from "react-native";

import useLocation from "../../hooks/useLocation";
import useNotification from "../../hooks/useNotification";
import useStore from "../../hooks/useStore";

const NotificationScreen = () => {
  const { getReverseGeocode } = useLocation();
  const { requestPermissionsAndGetToken } = useNotification();
  const { setUserId, setUserLocationNotification, userLocation } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleAllowAccess = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const permissionGranted = await requestPermissionsAndGetToken();
      await Promise.all([
        await getReverseGeocode(),
        async () => {
          if (permissionGranted) {
            setUserLocationNotification(userLocation);
          }
        },
      ]);
    } catch (error) {
    } finally {
      setUserId(Crypto.randomUUID());
      setIsLoading(false);
      router.replace("/(drawer)/radar");
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-secondary">
      <StatusBar barStyle="light-content" />
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
            <TouchableOpacity onPress={handleAllowAccess} disabled={isLoading} className="bg-white text-center py-3 rounded-full">
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#000" />
                  <Text className="text-center ml-2">Getting Notification...</Text>
                </View>
              ) : (
                <Text className="text-center">Allow Access Notification</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default NotificationScreen;
