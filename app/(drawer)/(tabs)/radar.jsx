import Mapbox, { Camera, FillExtrusionLayer, MapView, VectorSource } from "@rnmapbox/maps";
import { useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { parseLayerConfigToProps } from "../../../utilities/mapStyleParser";

import useFacilitiesData from "../../../hooks/useFacilitiesData";
import useStore from "../../../hooks/useStore";
import useWeatherData from "../../../hooks/useWeatherData";

import FacilityBottomSheet from "../../../ui/radar/FacilityBottomSheet";
import FacilityDirection from "../../../ui/radar/FacilityDirection";
import FacilityPoint from "../../../ui/radar/FacilityPoint";
import HazardLayer from "../../../ui/radar/HazardLayer";
import LayersSettings from "../../../ui/radar/LayersSettings";
import SideButtons from "../../../ui/radar/SideButtons";
import TimeStamp from "../../../ui/radar/TimeStamp";
import WeatherLayer from "../../../ui/radar/WeatherLayer";
import WeatherPoint from "../../../ui/radar/WeatherPoint";

const areCoordinatesEqual = (coord1, coord2, tolerance = 0.0001) => {
  if (!coord1 || !coord2) return false;
  const lonDiff = Math.abs(coord1[0] - coord2[0]);
  const latDiff = Math.abs(coord1[1] - coord2[1]);
  return lonDiff < tolerance && latDiff < tolerance;
};

const RadarScreen = () => {
  const { userLocation, openGroups, facilityDirection, setIsMapCentered, visibleLayers, currentTileUrlTemplate } = useStore();
  const { hazardLayers, weatherLayers, isLoading: weatherIsLoading, isRefetching: weatherIsRefetching } = useWeatherData();
  const { facilitiesData, isLoading: facilitiesIsLoading, isRefetching: facilitiesIsRefetching } = useFacilitiesData();

  console.log("RadarScreen Rendered with userLocation:", userLocation);

  const cameraMapRef = useRef(null);
  const facilityBottomSheetRef = useRef(null);

  const onRecenterPress = () => {
    if (cameraMapRef.current) {
      cameraMapRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 15,
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

  const openFacilityBottomSheet = () => {
    facilityBottomSheetRef.current?.expand();
  };

  const closeFacilityBottomSheet = () => {
    facilityBottomSheetRef.current?.close();
  };

  if (weatherIsLoading || weatherIsRefetching) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  console.log("RadarScreen Rendered");

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
              zoomLevel: 15,
              pitch: 30,
            }}
          />

          {/* 3D BUILDINGS */}
          <VectorSource id="composite" url="mapbox://mapbox.mapbox-streets-v8">
            <FillExtrusionLayer
              id="building-3d"
              sourceID="composite"
              sourceLayerID="building"
              style={{
                fillExtrusionHeight: ["get", "height"],

                fillExtrusionBase: 0,

                fillExtrusionColor: "#d3d3d3", // Light gray

                fillExtrusionOpacity: 0.85,
              }}
            />
          </VectorSource>

          {/* HAZARD LAYERS */}
          {hazardLayers?.hazardGroups &&
            hazardLayers.hazardGroups.flatMap((group) =>
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

          {/* WEATHER LAYERS */}
          {weatherLayers?.weatherGroups &&
            weatherLayers.weatherGroups.flatMap((group) =>
              openGroups.weather === group.id
                ? group.layers
                    .filter((layer) => {
                      const layerKey = `${group.id}_${layer.id}`;
                      return visibleLayers.weather === layerKey;
                    })
                    .map((layer) => {
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

          {/* WEATHER POINTS */}
          {weatherLayers?.weatherGroups &&
            weatherLayers?.weatherGroups.flatMap((group) =>
              openGroups.weather === group.id
                ? group.layers
                    .filter((layer) => {
                      const layerKey = `${group.id}_${layer.id}`;
                      return visibleLayers.weather === layerKey;
                    })
                    .flatMap((layer) => {
                      return (
                        layer.nearbyLocationWeather?.map((data) => {
                          const key = `${layer.id}_${data.name}_${data.latitude}_${data.longitude}`;
                          return <WeatherPoint key={key} id={`${layer.id}_${data.name}`} data={data} />;
                        }) || []
                      );
                    })
                : []
            )}

          {/* FACILITIES POINTS */}
          {facilitiesData &&
            facilitiesData?.map((facility) => (
              <FacilityPoint data={facility} key={`${facility.name}_${facility.latitude}_${facility.longitude}`} open={openFacilityBottomSheet} />
            ))}

          {/* FACILITIES DIRECTION */}
          {facilityDirection.geometry && <FacilityDirection route={facilityDirection} lineColor={facilityDirection.lineColor} />}
        </MapView>
      </View>

      {/* NOT IN MAPVIEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW */}
      {/* TIMESTAMP */}
      {weatherLayers?.weatherGroups &&
        weatherLayers.weatherGroups.flatMap((group) =>
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

      {/* NAVIGATIONS */}
      <FacilityBottomSheet isLoading={facilitiesIsLoading || facilitiesIsRefetching} ref={facilityBottomSheetRef} close={closeFacilityBottomSheet} />
      <LayersSettings weatherGroups={weatherLayers?.weatherGroups} hazardGroups={hazardLayers?.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} handleFacilityBottomSheetOpen={closeFacilityBottomSheet} />
    </View>
  );
};

export default RadarScreen;
