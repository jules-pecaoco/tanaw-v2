import Mapbox, { Camera, MapView } from "@rnmapbox/maps";
import { useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { parseLayerConfigToProps } from "../../../utilities/mapStyleParser";

import useStore from "../../../hooks/useStore";
import useWeatherData from "../../../hooks/useWeatherData";

import HazardLayer from "../../../ui/radar/HazardLayer";
import LayersSettings from "../../../ui/radar/LayersSettings";
import SideButtons from "../../../ui/radar/SideButtons";
import TimeStamp from "../../../ui/radar/TimeStamp";
import WeatherLayer from "../../../ui/radar/WeatherLayer";

const areCoordinatesEqual = (coord1, coord2, tolerance = 0.0001) => {
  if (!coord1 || !coord2) return false;
  const lonDiff = Math.abs(coord1[0] - coord2[0]);
  const latDiff = Math.abs(coord1[1] - coord2[1]);
  return lonDiff < tolerance && latDiff < tolerance;
};

const RadarScreen = () => {
  const { userLocation, openGroups, setIsMapCentered, visibleLayers, currentTileUrlTemplate } = useStore();
  const { hazardLayers, weatherLayers, isLoading, isRefetching, isError, error } = useWeatherData(userLocation);

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
    const isCentered = areCoordinatesEqual(currentCenter, [userLocation.longitude, userLocation.latitude]);

    setIsMapCentered(isCentered);
  };

  if (isLoading || isRefetching) {
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
          {hazardLayers.hazardGroups.flatMap((group) =>
            openGroups.hazard[group.id]
              ? group.layers
                  .filter((layer) => {
                    const layerKey = `${group.id}_${layer.id}`;
                    return visibleLayers.hazard?.[layerKey];
                  })
                  .map((layer) => {
                    const layerKey = `${group.id}_${layer.id}`;
                    return (
                      <HazardLayer
                        key={layerKey}
                        id={layerKey}
                        url={layer.tilesetUrl}
                        sourceLayerID={layer.sourceLayer}
                        style={parseLayerConfigToProps(layer.style)}
                      />
                    );
                  })
              : []
          )}
          {weatherLayers.weatherGroups.flatMap((group) =>
            openGroups.weather === group.id
              ? group.layers
                  .filter((layer) => {
                    const layerKey = `${group.id}_${layer.id}`;
                    return visibleLayers.weather === layerKey;
                  })
                  .map((layer) => {
                    const nearbyLocationWeather = layer.nearbyLocationWeather || [];

                    const getHeatColor = (heatIndex) => {
                      if (heatIndex >= 37) return "bg-red-500";
                      if (heatIndex >= 35) return "bg-orange-500";
                      if (heatIndex >= 33) return "bg-yellow-500";
                      return "bg-yellow-400";
                    };

                    console.log("nearbyLocationWeather", nearbyLocationWeather);
                    return (
                      <WeatherLayer
                        key={currentTileUrlTemplate}
                        tileUrlTemplates={currentTileUrlTemplate}
                        id={`${group.id}_${layer.id}`}
                        maxZoomLevel={group.maxZoomLevel}
                      />
                    );
                  })
              : []
          )}
        </MapView>
      </View>
      {weatherLayers.weatherGroups.flatMap((group) =>
        openGroups.weather === group.id
          ? group.layers
              .filter((layer) => {
                const layerKey = `${group.id}_${layer.id}`;
                return visibleLayers.weather === layerKey;
              })
              .map((layer) => {
                const layerKey = `${group.id}_${layer.id}`;
                if (typeof layer.tilesetUrl === "string") {
                  return (
                    <TimeStamp
                      key={layerKey}
                      maxPastCast={layer.maxPastCast}
                      maxFutureCast={layer.maxFutureCast}
                      interval={layer.interval}
                      url={layer.tilesetUrl}
                      isString={true}
                    />
                  );
                } else {
                  return (
                    <TimeStamp
                      key={layerKey}
                      maxPastCast={layer.maxPastCast}
                      maxFutureCast={layer.maxFutureCast}
                      interval={layer.interval}
                      url={layer.tilesetUrl}
                      isString={false}
                    />
                  );
                }
              })
          : []
      )}
      <LayersSettings weatherGroups={weatherLayers.weatherGroups} hazardGroups={hazardLayers.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} />
    </View>
  );
};

export default RadarScreen;
