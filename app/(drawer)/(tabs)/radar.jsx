import Mapbox, { Camera, MapView } from "@rnmapbox/maps";
import { useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { parseLayerConfigToProps } from "../../../utilities/index";

import useStore from "../../../hooks/useStore";
import useWeatherData from "../../../hooks/useWeatherData";

import HazardLayer from "../../../ui/radar/HazardLayer";
import LayersSettings from "../../../ui/radar/LayersSettings";
import SideButtons from "../../../ui/radar/SideButtons";

const areCoordinatesEqual = (coord1, coord2, tolerance = 0.0001) => {
  if (!coord1 || !coord2) return false;
  const lonDiff = Math.abs(coord1[0] - coord2[0]);
  const latDiff = Math.abs(coord1[1] - coord2[1]);
  return lonDiff < tolerance && latDiff < tolerance;
};

const RadarScreen = () => {
  const { userLocation, openGroups, setIsMapCentered, visibleLayers } = useStore();
  const { hazardLayers, weatherLayers, isLoading, isError, error } = useWeatherData(userLocation);

  console.log("RadarScreen Renderd");

  const cameraMapRef = useRef(null);
  const onRecenterPress = () => {
    if (cameraMapRef.current) {
      cameraMapRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 12,
        pitch: 30,
        heading: 0,
        animationDuration: 1000,
        animationMode: "flyTo",
      });
    }
    setIsMapCentered(true);
  };
  const handleCameraChanged = (event) => {
    const currentCenter = event.properties.center;
    console.log("Camera changed:", currentCenter);
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

  // const MemoWeatherLayer = useMemo(() => {
  //   return weatherLayers.weatherGroups.map(
  //     (group) =>
  //       openGroups.weather === group.id &&
  //       group.layers.map((layer) => {
  //         const layerKey = `${group.id}_${layer.id}`;
  //         return <WeatherLayer key={layerKey} id={layerKey} tileUrlTemplates={layer.tilesetUrl} />;
  //       })
  //   );
  // }, [weatherLayers.weatherGroups, visibleLayers.weather, openGroups.weather]);

  // const MemoHazardLayer = useMemo(() => {
  //   return
  // }, [hazardLayers.hazardGroups, visibleLayers.hazard, openGroups.hazard]);

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
          onMapIdle={handleCameraChanged}
        >
          <Camera
            ref={cameraMapRef}
            centerCoordinate={[userLocation.longitude, userLocation.latitude]}
            defaultSettings={{
              centerCoordinate: [userLocation.longitude, userLocation.latitude],
              zoomLevel: 12,
              pitch: 30,
            }}
          />
          {hazardLayers.hazardGroups.map(
            (group) =>
              openGroups.hazard[group.id] &&
              group.layers.map((layer) => {
                const layerKey = `${group.id}_${layer.id}`;
                return (
                  visibleLayers.hazard?.[layerKey] && (
                    <HazardLayer
                      key={layerKey}
                      id={layerKey}
                      url={layer.tilesetUrl}
                      sourceLayerID={layer.sourceLayer}
                      style={parseLayerConfigToProps(layer.style)}
                    />
                  )
                );
              })
          )}
        </MapView>
      </View>
      <LayersSettings weatherGroups={weatherLayers.weatherGroups} hazardGroups={hazardLayers.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} />
    </View>
  );
};

export default RadarScreen;
