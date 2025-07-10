import { MarkerView } from "@rnmapbox/maps";
import { Image } from "expo-image";

import useStore from "../../hooks/useStore";

import BouncingButton from "../components/BouncingButton";

import { View } from "react-native";
import { icons } from "../../constants/index";

const getImageUri = (type) => {
  switch (type) {
    case "hospital":
      return icons.hospitals;
    case "fire_station":
      return icons.firestations;
    case "evac_site":
      return icons.evacsites;
  }
};

const getBackgroundColor = (type) => {
  switch (type) {
    case "hospital":
      return "bg-red-500";
    case "fire_station":
      return "bg-yellow-500";
    case "evac_site":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const FacilityPoint = ({ data, open }) => {
  const { setFacilityBottomSheetData } = useStore();
  const { name, latitude, longitude, category } = data;

  if (typeof latitude !== "number" || typeof latitude !== "number") {
    console.error("Invalid coordinates for FacilityPoint:", data);
    return null;
  }

  return (
    <MarkerView coordinate={[longitude, latitude]} anchor={{ x: 0.5, y: 0.5 }} id={name}>
      <BouncingButton
        onPress={() => {
          setFacilityBottomSheetData(data);
          open();
        }}
      >
        <View className={`p-2 rounded-full items-center justify-center border-2 ${getBackgroundColor(category)}`}>
          <Image source={getImageUri(category)} contentFit="contain" style={{ width: 24, height: 24 }}></Image>
        </View>
      </BouncingButton>
    </MarkerView>
  );
};

export default FacilityPoint;
