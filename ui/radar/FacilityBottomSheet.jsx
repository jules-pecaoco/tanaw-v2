import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Linking from "expo-linking";
import { ActivityIndicator, Text, View } from "react-native";

import useStore from "../../hooks/useStore";

import { Ionicons } from "@expo/vector-icons";
import BouncingButton from "../components/BouncingButton";

const openPhoneDialer = (phoneNumber) => {
  const url = `tel:${phoneNumber}`;
  Linking.openURL(url).catch((err) => console.error("Failed to open dialer:", err));
};

const FacilityBottomSheet = ({ isLoading, ref, close }) => {
  const { showFacilityBottomSheet, facilityBottomSheetData } = useStore();
  const { name, short_address, international_phone_number, national_phone_number } = facilityBottomSheetData || {};

  return (
    <BottomSheet
      ref={ref}
      index={showFacilityBottomSheet ? 0 : -1}
      enablePanDownToClose={true}
      enableDynamicSizing={true}
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
          <View className="p-4">
            <Text className="text-xl font-tbold mb-1 text-secondary">{name}</Text>
            <Text className="text-sm font-tregular text-gray-500 mb-4">{short_address}</Text>
            {international_phone_number ? (
              <BouncingButton onPress={() => openPhoneDialer(international_phone_number)}>
                <View className="flex-row items-center bg-orange-100 p-3 rounded-full mb-4 w-fit">
                  <Ionicons name="call" size={20} color="#F47C25" />
                  <Text className="ml-2 text-base font-tmedium text-secondary">{international_phone_number}</Text>
                </View>
              </BouncingButton>
            ) : (
              <Text className="text-sm text-gray-500 mb-2">No International Phone Number</Text>
            )}
            {national_phone_number ? (
              <BouncingButton onPress={() => openPhoneDialer(national_phone_number)}>
                <View className="flex-row items-center bg-orange-100 p-3 rounded-full w-fit">
                  <Ionicons name="call" size={20} color="#F47C25" />
                  <Text className="ml-2 text-base font-tmedium text-secondary">{national_phone_number}</Text>
                </View>
              </BouncingButton>
            ) : (
              <Text className="text-sm text-gray-500">No National Phone Number</Text>
            )}
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

export default FacilityBottomSheet;
