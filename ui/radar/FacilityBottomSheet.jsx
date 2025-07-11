import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import useSearch from "../../hooks/useSearch";
import useStore from "../../hooks/useStore";

import BouncingButton from "../components/BouncingButton";

const getBackgroundColor = (type) => {
  switch (type) {
    case "hospital":
      return "#ef4444";
    case "fire_station":
      return "#eab308";
    case "evac_site":
      return "#3b82f6";
    default:
      return "bg-gray-500";
  }
};

const getCategory = (category) => {
  switch (category) {
    case "hospital":
      return "Hospital";
    case "fire_station":
      return "Fire Station";
    case "evac_site":
      return "Evacuation Site*";
  }
};

const openPhoneDialer = (phoneNumber) => {
  const url = `tel:${phoneNumber}`;
  Linking.openURL(url).catch((err) => console.error("Failed to open dialer:", err));
};

const FacilityBottomSheet = ({ isLoading, ref, close }) => {
  const { showFacilityBottomSheet, facilityBottomSheetData, facilityDirection, setFacilityDirection } = useStore();
  const { getDirections } = useSearch();
  const { name, short_address, international_phone_number, national_phone_number, category, latitude, longitude } = facilityBottomSheetData || {};
  const [directionIsLoading, setDirectionIsLoading] = useState(false);

  const handleDirection = async () => {
    setDirectionIsLoading(true);
    const destination = {
      latitude: latitude,
      longitude: longitude,
    };

    const direction = await getDirections(destination);
    direction.lineColor = getBackgroundColor(category);

    setFacilityDirection(direction);
    setDirectionIsLoading(false);
  };

  const handleRemoveDirection = () => {
    setFacilityDirection((state) => ({
      ...state,
      geometry: null,
      distance: null,
      duration: null,
      lineColor: null,
    }));
  };

  useEffect(() => {
    setFacilityDirection((state) => ({
      ...state,
      distance: null,
    }));
  }, [facilityBottomSheetData]);

  return (
    <BottomSheet
      ref={ref}
      index={showFacilityBottomSheet ? 0 : -1}
      enablePanDownToClose={true}
      snapPoints={["30%"]}
      backgroundStyle={{ backgroundColor: "white" }}
      detached={true}
      handleComponent={() => (
        <View className="flex-row items-center justify-between rounded-t-full p-4 bg-background">
          <Text className="text-lg font-tmedium text-secondary">Facility Details</Text>
          <BouncingButton onPress={close}>
            <Ionicons name="close" size={24}></Ionicons>
          </BouncingButton>
        </View>
      )}
      style={{
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        zIndex: 1000,
      }}
    >
      <BottomSheetView style={{ flex: 1, backgroundColor: "#fffcfa" }}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F47C25" />
          </View>
        ) : (
          <View className="px-4 pb-4">
            <Text className="text-xl font-tbold mb-1 text-secondary">{name}</Text>
            <Text className="text-sm font-tregular text-gray-500 ">{short_address}</Text>
            <Text className="text-base font-tmedium text-secondary mb-4">{getCategory(category)}</Text>

            {international_phone_number ? (
              <BouncingButton onPress={() => openPhoneDialer(international_phone_number)}>
                <View className="flex-row items-center bg-primary/50 p-3 rounded-full mb-4 w-fit">
                  <Ionicons name="call" size={20} color="#F47C25" />
                  <Text className="ml-2 text-base font-tmedium text-secondary">{international_phone_number}</Text>
                </View>
              </BouncingButton>
            ) : (
              <Text className="text-sm text-gray-500 mb-4">No International Phone Number</Text>
            )}
            <BouncingButton onPress={facilityDirection.distance ? handleRemoveDirection : handleDirection}>
              <View
                className={`flex-row items-center p-3 rounded-full mb-4 w-fit ${facilityDirection.distance ? "bg-red-500/60" : "bg-green-500/60"}`}
              >
                {directionIsLoading ? (
                  <ActivityIndicator size="small" color="#ffff" />
                ) : (
                  <Ionicons name={"navigate"} size={20} color={facilityDirection.distance ? "#ef4444" : "#22c55e"} />
                )}
                <Text className={`ml-2 text-base font-tmedium ${facilityDirection.distance ? "text-white" : "text-secondary"}`}>
                  {facilityDirection.distance ? "Remove Current Direction" : "Navigate Direction"}
                </Text>
              </View>
            </BouncingButton>
            {facilityDirection.distance && (
              <View className="flex-column  items-start w-fit">
                <Text className="ml-2 text-base font-tmedium text-secondary">Distance: {facilityDirection.distance}</Text>
                <Text className="ml-2 text-base font-tmedium text-secondary">Duraction: {facilityDirection.duration}</Text>
              </View>
            )}
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

export default FacilityBottomSheet;
