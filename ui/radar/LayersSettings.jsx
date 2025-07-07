import { Text, View } from "react-native";

import useStore from "../../hooks/useStore";

import BouncingButton from "../components/BouncingButton";

const LayersSettings = ({ weatherGroups, hazardGroups }) => {
  const { showMenu, openGroups, visibleLayers, toggleGroup, toggleLayer } = useStore();

  if (!showMenu) {
    return null;
  }

  return (
    <View className="absolute top-0 left-0 h-[50%] w-24 flex flex-col items-center justify-center">
      {/* Render weather groups */}
      <Text>Weather Layers</Text>
      {weatherGroups.map((group, index) => (
        // Render each weather group with a button
        <View key={group.name}>
          <View className="w-24 h-24">
            <BouncingButton
              onPress={() => toggleGroup(group.name)}
              className="w-full h-full"
              style={{ backgroundColor: openGroups[group.name] ? "lightblue" : "lightgray" }}
            >
              <Text>{group.name}</Text>
            </BouncingButton>
          </View>
          {/* Render each layer in a group */}
          {openGroups[group.name] && (
            <View className="flex-row flex-wrap">
              {group.layers.map((layer) => {
                const layerKey = `${group.name}-${layer.name}`;
                return (
                  <View key={layer.name} className="flex-row items-center">
                    <BouncingButton
                      onPress={() => toggleLayer(group.name, layer.name)}
                      className="w-24 h-24"
                      style={{ backgroundColor: visibleLayers[layerKey] ? "lightgreen" : "lightgray" }}
                    >
                      <Text>{layer.source}</Text>
                    </BouncingButton>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export default LayersSettings;
