import Mapbox, { Camera, MapView } from "@rnmapbox/maps";
import { ActivityIndicator, View } from "react-native";
import LayersSettings from "../../../ui/radar/LayersSettings";

import useStore from "../../../hooks/useStore";
import useWeatherData from "../../../hooks/useWeatherData";

import { useRef } from "react";
import SideButtons from "../../../ui/radar/SideButtons";

const areCoordinatesEqual = (coord1, coord2, tolerance = 0.0001) => {
  if (!coord1 || !coord2) return false;
  const lonDiff = Math.abs(coord1[0] - coord2[0]);
  const latDiff = Math.abs(coord1[1] - coord2[1]);
  return lonDiff < tolerance && latDiff < tolerance;
};

const RadarScreen = () => {
  const { userLocation, isMapCentered, setIsMapCentered, visibleLayers, toggleMenu, showMenu } = useStore();
  const { hazardLayers, weatherLayers, isLoading, isError, error } = useWeatherData(userLocation);

  const cameraMapRef = useRef(null);
  const onRecenterPress = () => {
    if (cameraMapRef.current) {
      cameraMapRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 12,
        pitch: 30,
        heading: 0,
        animationDUration: 500,
        animationMode: "flyTo",
      });
    }
    setIsMapCentered(true);
  };
  const handleCameraChanged = (event) => {
    const currentCenter = event.properties.center;
    const isCentered = areCoordinatesEqual(currentCenter, [userLocation.longitude, userLocation.latitude]);

    setIsMapCentered(isCentered);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }
  return (
    <View className="flex-1">
      <View className="flex-1">
        <MapView
          style={{ flex: 1 }}
          styleURL={Mapbox.StyleURL.Light}
          compassEnabled={true}
          compassFadeWhenNorth={true}
          logoEnabled={false}
          attributionEnabled={false}
          scaleBarEnabled={false}
          onCameraChanged={handleCameraChanged}
        >
          <Camera
            ref={cameraMapRef}
            centerCoordinate={[userLocation.longitude, userLocation.latitude]}
            defaultSettings={{
              centerCoordinate: [userLocation.longitude, userLocation.latitude],
              zoomLevel: 12,
              pitch: 30,
            }}
          ></Camera>
        </MapView>
        <LayersSettings weatherGroups={weatherLayers.weatherGroups} hazardGroups={hazardLayers.hazardGroups} />
        <SideButtons onRecenterPress={onRecenterPress} />
      </View>
    </View>
  );
};

export default RadarScreen;
