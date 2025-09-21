import Mapbox, { Camera, FillExtrusionLayer, Images, MapView, UserLocation, VectorSource } from "@rnmapbox/maps";
import { useMemo, useRef } from "react"; // MODIFIED: No longer need `useRef` from here, it's part of React.
import { ActivityIndicator, View } from "react-native";

import { icons } from "../../../constants/index";

import { parseLayerConfigToProps } from "../../../utilities/mapStyleParser";

// --- NEW IMPORTS ---
import useFacilitiesData from "../../../hooks/useFacilitiesData";
import useStore from "../../../hooks/useStore";
import useUserInfo from "../../../hooks/useUserInfo";
import useUserReportsData from "../../../hooks/useUserReportsData";
import useWeatherData from "../../../hooks/useWeatherData";

// --- UI IMPORTS ---
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
  const { userLocation, openGroups, facilityDirection, visibleLayers, currentTileUrlTemplate, setSelectedUserReport } = useStore();

  const { hazardLayers, weatherLayers, isLoading: weatherIsLoading } = useWeatherData();
  const { facilitiesData, isLoading: facilitiesIsLoading } = useFacilitiesData();
  const { userReports, isLoading: reportsIsLoading } = useUserReportsData();
  useUserInfo();

  const cameraMapRef = useRef(null);
  const facilityBottomSheetRef = useRef(null);
  const userReportBottomSheetRef = useRef(null);

  const activeLegends = useMemo(() => {
    const legends = [];

    // 1. Check for active hazard layers (this logic is likely correct but let's make it robust too)
    hazardLayers?.hazardGroups?.forEach((group) => {
      // Check if the group itself is open before checking its layers
      if (openGroups.hazard?.[group.id]) {
        group.layers.forEach((layer) => {
          const layerKey = `${group.id}_${layer.id}`;
          // Check if this layer's key exists and is set to `true` in the visibleLayers state
          if (visibleLayers.hazard?.[layerKey] && layer.legend) {
            legends.push({ layerName: layer.name, legend: layer.legend });
          }
        });
      }
    });

    // 2. Check for active weather layer by iterating through the source data
    weatherLayers?.weatherGroups?.forEach((group) => {
      // Check if the group itself is the currently open weather group
      if (openGroups.weather === group.id) {
        group.layers.forEach((layer) => {
          const layerKey = `${group.id}_${layer.id}`;
          // Check if the active weather layer key in the state matches this layer's key
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

  const openFacilityBottomSheet = () => facilityBottomSheetRef.current?.expand();
  const closeFacilityBottomSheet = () => facilityBottomSheetRef.current?.close();

  const openUserReportBottomSheet = (report) => {
    setSelectedUserReport(report); // Set the selected report in the global store
    userReportBottomSheetRef.current?.expand(); // Expand the sheet
  };
  const closeUserReportBottomSheet = () => {
    userReportBottomSheetRef.current?.close();
  };

  if (weatherIsLoading || facilitiesIsLoading || reportsIsLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  console.log("Radar Render");

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
              // Facilities
              hospital: icons.hospitals,
              fire_station: icons.firestations,
              evac_site: icons.evacsites,

              // User Reports
              Flood: icons.flood,
              Fire: icons.fire,
              Landslide: icons.landslide,
              Accident: icons.accident,
              Earthquake: icons.earthquake,
              Other: icons.hazard,
            }}
          />

          {/* 3D BUILDINGS */}
          <VectorSource id="composite" url="mapbox://mapbox.mapbox-streets-v8">
            <FillExtrusionLayer
              id="building-3d"
              sourceID="composite"
              sourceLayerID="building"
              style={{ fillExtrusionHeight: ["get", "height"], fillExtrusionBase: 0, fillExtrusionColor: "#d3d3d3", fillExtrusionOpacity: 0.85 }}
            />
          </VectorSource>

          {/* HAZARD LAYERS */}
          {hazardLayers?.hazardGroups &&
            hazardLayers?.hazardGroups.flatMap((group) =>
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
                      />
                    ))
                : []
            )}

          {/* WEATHER LAYERS */}
          {weatherLayers?.weatherGroups &&
            weatherLayers?.weatherGroups.flatMap((group) =>
              openGroups.weather === group.id
                ? group.layers
                    .filter((layer) => visibleLayers.weather === `${group.id}_${layer.id}`)
                    .map((layer) => (
                      <WeatherLayer
                        key={currentTileUrlTemplate}
                        tileUrlTemplates={currentTileUrlTemplate}
                        id={`${group.id}_${layer.id}`}
                        maxZoomLevel={group.maxZoomLevel}
                      />
                    ))
                : []
            )}

          {/* WEATHER POINTS */}
          {weatherLayers?.weatherGroups &&
            weatherLayers?.weatherGroups.flatMap((group) =>
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

          {/* FACILITIES DIRECTION  */}
          {facilityDirection.geometry && <FacilityDirection route={facilityDirection} lineColor={facilityDirection.lineColor} />}
        </MapView>
      </View>

      {/* --- UI OVERLAYS / MAPVIEW BORDER--- -----------------------------------------------------------------------------------------*/}

      {/* TIMESTAMP (Unchanged) */}
      {weatherLayers?.weatherGroups &&
        weatherLayers.weatherGroups.flatMap((group) =>
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

      {/* NAVIGATIONS & SETTINGS */}
      <FacilityBottomSheet ref={facilityBottomSheetRef} close={closeFacilityBottomSheet} />
      <LayersSettings weatherGroups={weatherLayers?.weatherGroups} hazardGroups={hazardLayers?.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} handleFacilityBottomSheetOpen={closeFacilityBottomSheet} />

      {/* LEGEND  */}
      <MapLegend legends={activeLegends} />

      {/* REPORT BOTTOM SHEET */}
      <UserReportBottomSheet ref={userReportBottomSheetRef} close={closeUserReportBottomSheet} />
    </View>
  );
};

export default RadarScreen;
