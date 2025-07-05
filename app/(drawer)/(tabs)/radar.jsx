import Mapbox, { Camera, MapView } from "@rnmapbox/maps";
import { View } from "react-native";

const RadarScreen = () => {
  return (
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
        {/* <VectorSource id="radar-source" url="mapbox://jules-pecaoco-dev.4p3rwjm0">
          <FillLayer
            id="radar-source"
            sourceLayerID="flood_100year"
            style={{
              fillColor: ["interpolate", ["linear"], ["get", "Var"], 1, "#FFFF00", 2, "#FFA500", 3, "#FF4500"],
              fillOpacity: 0.8,
            }}
          ></FillLayer>
        </VectorSource> */}
        <Camera
          centerCoordinate={[122.93849508523817, 10.653126963455296]}
          animationDuration={1000}
          defaultSettings={{
            centerCoordinate: [122.93849508523817, 10.653126963455296],
            zoomLevel: 12,
            pitch: 30,
          }}
        ></Camera>
      </MapView>
    </View>
  );
};

export default RadarScreen;
