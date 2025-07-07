import { MapView } from "@rnmapbox/maps";
import { ActivityIndicator, View } from "react-native";

import useStore from "../../../hooks/useStore";
import useWeatherData from "../../../hooks/useWeatherData";

import LayersSettings from "../../../ui/radar/LayersSettings";
import SideButtons from "../../../ui/radar/SideButtons";

const RadarScreen = () => {
  const userLocation = {
    latitude: 10.653126963455296,
    longitude: 122.93849508523817,
  };

  const { visibleLayers, toggleMenu, showMenu } = useStore();
  const { hazardLayers, weatherLayers, isLoading, isError, error } = useWeatherData(userLocation);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }}></MapView>
      <LayersSettings weatherGroups={weatherLayers.weatherGroups} hazardGroups={hazardLayers.hazardGroups} />
      <SideButtons />
    </View>
  );
};

export default RadarScreen;
