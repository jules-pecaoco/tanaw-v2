import Mapbox, { Camera, MapView } from "@rnmapbox/maps";
import { View } from "react-native";

const BaseMap = () => {
  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Light}
        compassEnabled={true}
        compassFadeWhenNorth={true}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          centerCoordinate={[122.93849508523817, 10.653126963455296]}
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

export default BaseMap;
