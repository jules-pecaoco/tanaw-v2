import Mapbox, { Camera, FillExtrusionLayer, Images, MapView, UserLocation, VectorSource } from "@rnmapbox/maps";
import { useMemo, useRef } from "react"; // MODIFIED: No longer need `useRef` from here, it's part of React.
import { ActivityIndicator, View } from "react-native";

import { icons } from "../../../constants/index";

import { parseLayerConfigToProps } from "../../../utilities/mapStyleParser";

// --- NEW IMPORTS ---
import useFacilitiesData from "../../../hooks/useFacilitiesData";
import useStore from "../../../hooks/useStore";
import useUserInfo from "../../../hooks/useUserInfo";
import useUserReportsData from "../../../hooks/useUserReportsData"; // NEW: Import the hook for user reports
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
import UserReportBottomSheet from "../../../ui/radar/UserReportBottomSheet"; // NEW: Import the bottom sheet component
import UserReportPoints from "../../../ui/radar/UserReportPoints";
import WeatherLayer from "../../../ui/radar/WeatherLayer";
import WeatherPoints from "../../../ui/radar/WeatherPoints";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN);

const RadarScreen = () => {
  const { userLocation, openGroups, facilityDirection, visibleLayers, currentTileUrlTemplate, setSelectedUserReport } = useStore();

  // --- MODIFIED: Fetch data from all sources ---
  const { hazardLayers, weatherLayers, isLoading: weatherIsLoading } = useWeatherData();
  const { facilitiesData, isLoading: facilitiesIsLoading } = useFacilitiesData();
  const { userReports, isLoading: reportsIsLoading } = useUserReportsData(); // NEW: Fetch user reports
  useUserInfo();

  // --- MODIFIED: Add refs for the new bottom sheet ---
  const cameraMapRef = useRef(null);
  const facilityBottomSheetRef = useRef(null);
  const userReportBottomSheetRef = useRef(null); // NEW: Create a ref for the report bottom sheet

  // --- UNCHANGED: Legend logic ---
  const activeLegends = useMemo(() => {
    // ... (your existing legend logic remains the same)
    const legends = [];
    if (hazardLayers?.hazardGroups && visibleLayers.hazard) {
      for (const layerKey in visibleLayers.hazard) {
        if (visibleLayers.hazard[layerKey]) {
          const [groupId, layerId] = layerKey.split("_");
          const group = hazardLayers.hazardGroups.find((g) => g.id === groupId);
          const layer = group?.layers.find((l) => l.id === layerId);
          if (layer?.legend) legends.push({ layerName: layer.name, legend: layer.legend });
        }
      }
    }
    if (weatherLayers?.weatherGroups && visibleLayers.weather) {
      const [groupId, layerId] = visibleLayers.weather.split("_");
      const group = weatherLayers.weatherGroups.find((g) => g.id === groupId);
      const layer = group?.layers.find((l) => l.id === layerId);
      if (layer?.legend) legends.push({ layerName: layer.name, legend: layer.legend });
    }
    return legends;
  }, [visibleLayers, hazardLayers, weatherLayers]);

  // --- UNCHANGED: Recenter function ---
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

  // --- UNCHANGED: Facility Bottom Sheet functions ---
  const openFacilityBottomSheet = () => facilityBottomSheetRef.current?.expand();
  const closeFacilityBottomSheet = () => facilityBottomSheetRef.current?.close();

  // --- NEW: Functions to control the User Report Bottom Sheet ---
  const openUserReportBottomSheet = (report) => {
    setSelectedUserReport(report); // Set the selected report in the global store
    userReportBottomSheetRef.current?.expand(); // Expand the sheet
  };
  const closeUserReportBottomSheet = () => {
    userReportBottomSheetRef.current?.close();
    // Optional: Clear the selected report from the store on close
    // setTimeout(() => setSelectedUserReport(null), 250);
  };

  // --- MODIFIED: Update the main loading state to include reports ---
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

          {/* --- NEW: Render the user report points on the map --- */}
          <UserReportPoints reports={userReports} onReportPress={openUserReportBottomSheet} />

          {/* FACILITIES DIRECTION  */}
          {facilityDirection.geometry && <FacilityDirection route={facilityDirection} lineColor={facilityDirection.lineColor} />}
        </MapView>
      </View>

      {/* --- UI OVERLAYS --- */}

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

      {/* NAVIGATIONS & SETTINGS (Unchanged) */}
      <FacilityBottomSheet ref={facilityBottomSheetRef} close={closeFacilityBottomSheet} />
      <LayersSettings weatherGroups={weatherLayers?.weatherGroups} hazardGroups={hazardLayers?.hazardGroups} />
      <SideButtons onRecenterPress={onRecenterPress} handleFacilityBottomSheetOpen={closeFacilityBottomSheet} />

      {/* LEGEND (Unchanged) */}
      <MapLegend legends={activeLegends} />

      {/* --- NEW: Render the User Report Bottom Sheet --- */}
      <UserReportBottomSheet ref={userReportBottomSheetRef} close={closeUserReportBottomSheet} />
    </View>
  );
};

export default RadarScreen;
