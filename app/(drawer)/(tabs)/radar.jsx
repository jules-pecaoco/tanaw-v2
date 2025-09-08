import Mapbox, { Camera, FillExtrusionLayer, Images, MapView, UserLocation, VectorSource } from "@rnmapbox/maps";
import { useMemo, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { icons } from "../../../constants/index";

import { parseLayerConfigToProps } from "../../../utilities/mapStyleParser";

import useFacilitiesData from "../../../hooks/useFacilitiesData";
import useStore from "../../../hooks/useStore";
import useUserInfo from "../../../hooks/useUserInfo";
import useWeatherData from "../../../hooks/useWeatherData";

import FacilityBottomSheet from "../../../ui/radar/FacilityBottomSheet";
import FacilityDirection from "../../../ui/radar/FacilityDirection";
import FacilityPoints from "../../../ui/radar/FacilityPoints";
import HazardLayer from "../../../ui/radar/HazardLayer";
import LayersSettings from "../../../ui/radar/LayersSettings";
import MapLegend from "../../../ui/radar/MapLegend";
import SideButtons from "../../../ui/radar/SideButtons";
import TimeStamp from "../../../ui/radar/TimeStamp";
import WeatherLayer from "../../../ui/radar/WeatherLayer";
import WeatherPoints from "../../../ui/radar/WeatherPoints";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN);

const RadarScreen = () => {
  const { userLocation, openGroups, facilityDirection, visibleLayers, currentTileUrlTemplate } = useStore();
  const { hazardLayers, weatherLayers, isLoading: weatherIsLoading, isRefetching: weatherIsRefetching } = useWeatherData();
  const { facilitiesData, isLoading: facilitiesIsLoading, isRefetching: facilitiesIsRefetching } = useFacilitiesData();
  useUserInfo();

  const cameraMapRef = useRef(null);
  const facilityBottomSheetRef = useRef(null);

  const activeLegends = useMemo(() => {
    const legends = [];

    // 1. Check for active hazard layers
    hazardLayers?.hazardGroups?.forEach((group) => {
      // NEW: Check if the group itself is open before checking its layers
      if (openGroups.hazard?.[group.id]) {
        group.layers.forEach((layer) => {
          const layerKey = `${group.id}_${layer.id}`;
          // Check if this layer's key exists and is set to `true`
          if (visibleLayers.hazard?.[layerKey] && layer.legend) {
            legends.push({ layerName: layer.name, legend: layer.legend });
          }
        });
      }
    });

    // 2. Check for active weather layer
    weatherLayers?.weatherGroups?.forEach((group) => {
      // NEW: Check if the group itself is the currently open weather group
      if (openGroups.weather === group.id) {
        group.layers.forEach((layer) => {
          const layerKey = `${group.id}_${layer.id}`;
          // Check if the active weather layer key matches this layer's key
          if (visibleLayers.weather === layerKey && layer.legend) {
            legends.push({ layerName: layer.name, legend: layer.legend });
          }
        });
      }
    });

    return legends;
  }, [visibleLayers, openGroups, hazardLayers, weatherLayers]);

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
  };

  const openFacilityBottomSheet = () => {
    facilityBottomSheetRef.current?.expand();
  };

  const closeFacilityBottomSheet = () => {
    facilityBottomSheetRef.current?.close();
  };

  // MODIFIED: Show loading indicator if weather data OR facilities data is loading
  if (weatherIsLoading || facilitiesIsLoading) {
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
        >
          {/* ... (Camera, UserLocation, Images, FillExtrusionLayer are unchanged) ... */}
          <Camera
            ref={cameraMapRef}
            centerCoordinate={[userLocation.longitude, userLocation.latitude]}
            defaultSettings={{
              centerCoordinate: [userLocation.longitude, userLocation.latitude],
              zoomLevel: 15,
              pitch: 30,
            }}
          />

          <UserLocation />

          <Images
            images={{
              hospital: icons.hospitals,
              fire_station: icons.firestations,
              evac_site: icons.evacsites,
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
                fillExtrusionColor: "#d3d3d3",
                fillExtrusionOpacity: 0.85,
              }}
            />
          </VectorSource>

          {/* ... (HazardLayers, WeatherLayers, WeatherPoints, FacilityPoints, FacilityDirection are unchanged) ... */}
          {/* HAZARD LAYERS */}
          {hazardLayers?.hazardGroups &&
            hazardLayers?.hazardGroups.flatMap((group) =>
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
            weatherLayers?.weatherGroups.flatMap((group) =>
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
                    .flatMap((layer) => (layer?.nearbyLocationWeather ? <WeatherPoints key={layer.id} datas={layer.nearbyLocationWeather} /> : []))
                : []
            )}

          {/* FACILITIES POINTS */}
          {facilitiesData && <FacilityPoints datas={facilitiesData} open={openFacilityBottomSheet} />}

          {/* FACILITIES DIRECTION */}
          {facilityDirection.geometry && <FacilityDirection route={facilityDirection} lineColor={facilityDirection.lineColor} />}
        </MapView>
      </View>

      {/* UI OVERLAYS */}
      {/* ... (TimeStamp is unchanged) ... */}
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

      {/* NAVIGATIONS & SETTINGS */}
      <FacilityBottomSheet isLoading={facilitiesIsLoading || facilitiesIsRefetching} ref={facilityBottomSheetRef} close={closeFacilityBottomSheet} />
      <LayersSettings weatherGroups={weatherLayers?.weatherGroups} hazardGroups={hazardLayers?.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} handleFacilityBottomSheetOpen={closeFacilityBottomSheet} />

      {/* NEW: Render the MapLegend component with the active legends */}
      <MapLegend legends={activeLegends} />
    </View>
  );
};

export default RadarScreen;
