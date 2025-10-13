import Mapbox, { Camera, FillExtrusionLayer, Images, MapView, UserLocation, VectorSource } from "@rnmapbox/maps";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { icons } from "../../../constants";
import { parseLayerConfigToProps } from "../../../utilities/mapStyleParser";

// --- HOOKS ---
import useFacilitiesData from "../../../hooks/useFacilitiesData";
import useStore from "../../../hooks/useStore";
import useUserInfo from "../../../hooks/useUserInfo";
import useUserReportsData from "../../../hooks/useUserReportsData";
import useWeatherData from "../../../hooks/useWeatherData";

// --- UI ---
import FacilityBottomSheet from "../../../ui/radar/FacilityBottomSheet";
import FacilityDirection from "../../../ui/radar/FacilityDirection";
import FacilityPoints from "../../../ui/radar/FacilityPoints";
import HazardLayer from "../../../ui/radar/HazardLayer";
import LayersSettings from "../../../ui/radar/LayersSettings";
import MapLegend from "../../../ui/radar/MapLegend";
import SideButtons from "../../../ui/radar/SideButtons";
import TimeStamp from "../../../ui/radar/TimeStamp";
import UserReportBottomSheet from "../../../ui/radar/UserReportBottomSheet";
import UserReportPoints from "../../../ui/radar/UserReportPoints";
import WeatherLayer from "../../../ui/radar/WeatherLayer";
import WeatherPoints from "../../../ui/radar/WeatherPoints";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN);

const RadarScreen = () => {
  const { userLocation, openGroups, facilityDirection, visibleLayers, currentTileUrlTemplate, setSelectedUserReport, currentMapStyleUrl } =
    useStore();

  const { hazardLayers, weatherLayers, isLoading: weatherIsLoading } = useWeatherData();
  const { facilitiesData, isLoading: facilitiesIsLoading } = useFacilitiesData();
  const { userReports, isLoading: reportsIsLoading } = useUserReportsData();
  useUserInfo();

  const cameraMapRef = useRef(null);
  const facilityBottomSheetRef = useRef(null);
  const userReportBottomSheetRef = useRef(null);

  const [styleLoaded, setStyleLoaded] = useState(false);

  const activeLegends = useMemo(() => {
    const legends = [];

    hazardLayers?.hazardGroups?.forEach((group) => {
      if (openGroups.hazard?.[group.id]) {
        group.layers.forEach((layer) => {
          const key = `${group.id}_${layer.id}`;
          if (visibleLayers.hazard?.[key] && layer.legend) {
            legends.push({ layerName: layer.name, legend: layer.legend });
          }
        });
      }
    });

    weatherLayers?.weatherGroups?.forEach((group) => {
      if (openGroups.weather === group.id) {
        group.layers.forEach((layer) => {
          const key = `${group.id}_${layer.id}`;
          if (visibleLayers.weather === key && layer.legend) {
            legends.push({ layerName: layer.name, legend: layer.legend });
          }
        });
      }
    });

    return legends;
  }, [visibleLayers, openGroups, hazardLayers, weatherLayers]);

  const onRecenterPress = () => {
    cameraMapRef.current?.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel: 15,
      pitch: 30,
      heading: 0,
      animationDuration: 1000,
      animationMode: "flyTo",
    });
  };

  const openFacilityBottomSheet = () => facilityBottomSheetRef.current?.expand();
  const closeFacilityBottomSheet = () => facilityBottomSheetRef.current?.close();

  const openUserReportBottomSheet = (report) => {
    setSelectedUserReport(report);
    userReportBottomSheetRef.current?.expand();
  };
  const closeUserReportBottomSheet = () => userReportBottomSheetRef.current?.close();

  if (weatherIsLoading || facilitiesIsLoading || reportsIsLoading) {
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
          styleURL={currentMapStyleUrl}
          compassEnabled
          compassFadeWhenNorth
          logoEnabled={false}
          attributionEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingStyle={() => setStyleLoaded(true)}
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
          <UserLocation />
          <Images
            images={{
              hospital: icons.hospitals,
              fire_station: icons.firestations,
              evac_site: icons.evacsites,
              Flood: icons.flood,
              Fire: icons.fire,
              Landslide: icons.landslide,
              Accident: icons.accident,
              Earthquake: icons.earthquake,
              Other: icons.hazard,
            }}
          />
          {/* 🧱 3D BUILDINGS — render only after style load and if not pure raster */}
          <VectorSource id="composite" url="mapbox://mapbox.mapbox-streets-v8">
            <FillExtrusionLayer
              id="building-3d"
              sourceID="composite"
              sourceLayerID="building"
              belowId="settlement-label"
              style={{
                fillExtrusionHeight: ["get", "height"],
                fillExtrusionBase: 0,
                fillExtrusionColor: "#d3d3d3",
                fillExtrusionOpacity: 0.85,
              }}
            />
          </VectorSource>
          {/* HAZARD LAYERS */}
          {hazardLayers?.hazardGroups?.flatMap((group) =>
            openGroups.hazard[group.id]
              ? group.layers
                  .filter((layer) => visibleLayers.hazard?.[`${group.id}_${layer.id}`])
                  .map((layer) => (
                    <HazardLayer
                      key={`${group.id}_${layer.id}`}
                      id={`${group.id}_${layer.id}`}
                      url={layer.tilesetUrl}
                      sourceLayerID={layer.sourceLayer}
                      style={parseLayerConfigToProps(layer.style)}
                      belowLayerID="building-3d"
                    />
                  ))
              : []
          )}

          {/* WEATHER LAYERS */}
          {weatherLayers?.weatherGroups?.flatMap((group) =>
            openGroups.weather === group.id
              ? group.layers
                  .filter((layer) => visibleLayers.weather === `${group.id}_${layer.id}`)
                  .map((layer) => (
                    <WeatherLayer
                      key={currentTileUrlTemplate}
                      tileUrlTemplates={currentTileUrlTemplate}
                      id={`${group.id}_${layer.id}`}
                      maxZoomLevel={group.maxZoomLevel}
                      belowLayerID="building-3d"
                    />
                  ))
              : []
          )}
          {/* WEATHER POINTS */}
          {weatherLayers?.weatherGroups?.flatMap((group) =>
            openGroups.weather === group.id
              ? group.layers
                  .filter((layer) => visibleLayers.weather === `${group.id}_${layer.id}`)
                  .flatMap((layer) => (layer?.nearbyLocationWeather ? <WeatherPoints key={layer.id} datas={layer.nearbyLocationWeather} /> : []))
              : []
          )}
          {/* FACILITIES POINTS */}
          {facilitiesData && <FacilityPoints datas={facilitiesData} open={openFacilityBottomSheet} />}
          {/* REPORT POINTS */}
          <UserReportPoints reports={userReports} onReportPress={openUserReportBottomSheet} />
          {/* FACILITY DIRECTION */}
          {facilityDirection.geometry && <FacilityDirection route={facilityDirection} lineColor={facilityDirection.lineColor} />}
        </MapView>
      </View>

      {/* --- UI Overlays --- */}
      {weatherLayers?.weatherGroups?.flatMap((group) =>
        openGroups.weather === group.id
          ? group.layers
              .filter((layer) => visibleLayers.weather === `${group.id}_${layer.id}`)
              .map((layer) => {
                const isString = typeof layer.tilesetUrl === "string";
                return (
                  <TimeStamp
                    key={`${group.id}_${layer.id}`}
                    maxPastCast={layer.maxPastCast}
                    maxFutureCast={layer.maxFutureCast}
                    interval={layer.interval}
                    url={layer.tilesetUrl}
                    isString={isString}
                  />
                );
              })
          : []
      )}

      <FacilityBottomSheet ref={facilityBottomSheetRef} close={closeFacilityBottomSheet} />
      <LayersSettings weatherGroups={weatherLayers?.weatherGroups} hazardGroups={hazardLayers?.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} handleFacilityBottomSheetOpen={closeFacilityBottomSheet} />
      <MapLegend legends={activeLegends} />
      <UserReportBottomSheet ref={userReportBottomSheetRef} close={closeUserReportBottomSheet} />
    </View>
  );
};

export default RadarScreen;
