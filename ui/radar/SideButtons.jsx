import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
// HOOKS
import useStore from "../../hooks/useStore";
// COMPONENTS
import BouncingButton from "../components/BouncingButton";

const mapStyles = [
  { id: "light", name: "Light", icon: "sunny-outline" },
  { id: "dark", name: "Dark", icon: "moon-outline" },
  { id: "satellite", name: "Satellite", icon: "earth-outline" },
  { id: "street", name: "Streets", icon: "map-outline" },
  { id: "outdoors", name: "Outdoors", icon: "trail-sign-outline" },
];

const SideButtons = ({ onRecenterPress, handleFacilityBottomSheetOpen }) => {
  const { toggleMenu, showMenu, isMapCentered, currentMapStyle, setMapStyle } = useStore();

  const [showMapStyles, setShowMapStyles] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  const toggleMapStyles = () => {
    setShowMapStyles(!showMapStyles);
    Animated.timing(slideAnim, {
      toValue: showMapStyles ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleStyleChange = (styleId) => {
    setMapStyle(styleId);
    setShowMapStyles(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const currentStyleData = mapStyles.find((s) => s.id === currentMapStyle) || mapStyles[0];

  return (
    <View className="absolute top-36 right-5 h-full w-24 flex flex-col items-center justify-center" style={{ zIndex: 11 }}>
      <View className="flex flex-col items-center justify-center">
        {/* Layers Toggle Button */}
        <BouncingButton
          onPress={() => {
            handleFacilityBottomSheetOpen();
            toggleMenu();
          }}
        >
          <View className="w-20 h-20 mb-6 bg-background rounded-full flex items-center justify-center shadow-neutral-200 shadow-md">
            <Ionicons name={`${showMenu ? "layers" : "layers-outline"}`} size={28} color={`${showMenu ? "#F47C25" : "black"}`} />
          </View>
        </BouncingButton>

        {/* Map Style Selector */}
        <View className="relative mb-6">
          {/* Expanded Menu */}
          <Animated.View
            className="absolute right-20 top-0"
            style={{
              opacity: slideAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }}
            pointerEvents={showMapStyles ? "auto" : "none"}
          >
            <View className="bg-background rounded-2xl shadow-lg shadow-neutral-400 p-2 min-w-[140px]">
              {mapStyles.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  onPress={() => handleStyleChange(style.id)}
                  className="flex-row items-center px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: currentMapStyle === style.id ? "#FFF5F0" : "transparent",
                  }}
                >
                  <Ionicons name={style.icon} size={20} color={currentMapStyle === style.id ? "#F47C25" : "#666"} />
                  <Text
                    className="ml-3 text-sm font-medium"
                    style={{
                      color: currentMapStyle === style.id ? "#F47C25" : "#333",
                    }}
                  >
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Map Style Button */}
          <BouncingButton onPress={toggleMapStyles}>
            <View className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-neutral-200 shadow-md">
              <Ionicons name={showMapStyles ? "close" : currentStyleData.icon} size={24} color={showMapStyles ? "#F47C25" : "black"} />
            </View>
          </BouncingButton>
        </View>

        {/* Recenter Button */}
        <BouncingButton onPress={onRecenterPress}>
          <View className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-neutral-200 shadow-md">
            <Ionicons name={`${isMapCentered ? "location" : "location-outline"}`} size={24} color={`${isMapCentered ? "#F47C25" : "black"}`} />
          </View>
        </BouncingButton>
      </View>
    </View>
  );
};

export default SideButtons;
