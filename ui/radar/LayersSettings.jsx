import { ScrollView, Text, View } from "react-native";

import useStore from "../../hooks/useStore";

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import BouncingButton from "../components/BouncingButton";

const LayersSettings = ({ weatherGroups, hazardGroups }) => {
  const { showMenu, toggleMenu, openGroups, visibleLayers, toggleGroup, toggleLayer } = useStore();

  if (!showMenu) {
    return null;
  }

  return (
    <View className="absolute bottom-0 w-full bg-white z-50">
      <ScrollView className="flex-1 h-fit max-h-[55vh] w-full px-5 pt-5">
        <View className="flex-row flex-wrap justify-end">
          <BouncingButton onPress={toggleMenu}>
            <Ionicons name="close" size={24} color="black"></Ionicons>
          </BouncingButton>
        </View>

        {/* Render weather groups */}
        <View className="flex flex-col items-center w-full mb-5">
          <Text className="font-tmedium mb-5 text-start w-full">Weather Layers</Text>
          <View className="flex flex-col items-center w-full">
            <View className="flex flex-row flex-wrap justify-center item-center">
              {weatherGroups.map((group) => (
                // Render each weather group with a button
                <BouncingButton
                  key={group.id}
                  onPress={() => toggleGroup(group.id)}
                  className={`flex-1 h-24 min-w-[20%] flex mx-3 mb-5 items-center justify-center rounded-2xl border bg-background
                ${openGroups[group.id] ? "border-primary border-2" : "border-secondary"}`}
                >
                  <Image source={group.icon} contentFit="contain" style={{ height: 30, width: 30, alignSelf: "center", marginBottom: 5 }}></Image>
                  <Text className="font-tregular text-center">{group.name}</Text>
                </BouncingButton>
              ))}
            </View>
            <View className="flex justify-around w-full">
              {weatherGroups.map((group) => (
                <View className="w-full" key={group.id}>
                  {openGroups[group.id] && (
                    <>
                      <View className="w-full mb-5 flex-row items-center">
                        <View className="h-[1px] flex-1 bg-black"></View>
                        <View className="mx-2">
                          <Text className="font-tmedium">{group.name} Sources</Text>
                        </View>
                        <View className="h-[1px] flex-1 bg-black"></View>
                      </View>
                      <View className="flex-row justify-around mb-5">
                        {group.layers.map((layer) => {
                          const layerKey = `${group.id}_${layer.id}`;
                          return (
                            <BouncingButton
                              key={layerKey}
                              onPress={() => {
                                toggleLayer(group.id, layer.id);
                              }}
                              className={`flex-1 h-24 min-w-[30%] flex mx-3 items-center justify-center rounded-2xl border bg-background
                ${visibleLayers[layerKey] ? "border-primary border-2" : "border-secondary"}`}
                            >
                              <Image
                                source={layer.icon}
                                contentFit="contain"
                                style={{ width: 40, height: 40, alignSelf: "center", marginBottom: 5 }}
                              ></Image>
                              <Text className="font-tregular  text-center">{layer.source}</Text>
                            </BouncingButton>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="h-[1px] bg-black w-full mb-5"></View>

        {/* Render hazard groups */}
        <View className="flex flex-col items-center w-full">
          <Text className="font-tmedium mb-5 text-start w-full">Hazard Layers</Text>
          <View className="flex flex-col items-center w-full">
            <View className="flex-row flex-wrap justify-around mb-5">
              {hazardGroups.map((group) => (
                // Render each hazard group with a button
                <BouncingButton
                  key={group.id}
                  onPress={() => toggleGroup(group.id)}
                  className={`flex-1 h-24 min-w-[20%] flex mx-3 mb-5 items-center justify-center rounded-2xl border bg-background
                ${openGroups[group.id] ? "border-primary border-2" : "border-secondary"}`}
                >
                  <Image source={group.icon} contentFit="contain" style={{ height: 30, width: 30, alignSelf: "center", marginBottom: 5 }}></Image>
                  <Text className="font-tregular text-center">{group.name}</Text>
                </BouncingButton>
              ))}
            </View>
            <View className="flex justify-around w-full">
              {hazardGroups.map((group) => (
                <View key={group.id} className="w-full">
                  {openGroups[group.id] && (
                    <>
                      <View className="w-full mb-5 flex-row items-center">
                        <View className="h-[1px] flex-1 bg-black"></View>
                        <View className="mx-2">
                          <Text className="font-tmedium">{group.name}</Text>
                        </View>
                        <View className="h-[1px] flex-1 bg-black"></View>
                      </View>
                      <View className="flex-row flex-wrap justify-around mb-5">
                        {group.layers.map((layer) => {
                          const layerKey = `${group.id}_${layer.id}`;
                          return (
                            <BouncingButton
                              key={layerKey}
                              onPress={() => {
                                toggleLayer(group.id, layer.id);
                              }}
                              className={`flex-1 min-w-[30%] h-24 flex mx-3 items-center justify-center rounded-2xl border bg-background mb-5
                             ${visibleLayers[layerKey] ? "border-primary border-2" : "border-secondary"}`}
                            >
                              <Text className="font-tregular  text-center">{layer.name}</Text>
                            </BouncingButton>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LayersSettings;
