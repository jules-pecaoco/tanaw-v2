import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

// HOOKS
import useStore from "../../hooks/useStore";

// COMPONENTS
import BouncingButton from "../components/BouncingButton";

const SideButtons = ({ onRecenterPress }) => {
  const { toggleMenu, showMenu, isMapCentered } = useStore();
  console.log("SideButtons Rendered", isMapCentered);
  return (
    <View className="absolute top-36 right-5 h-full w-24 flex flex-col items-center justify-center">
      <View className="flex flex-col items-center justify-center">
        <BouncingButton onPress={toggleMenu}>
          <View className="w-20 h-20 mb-6  bg-background rounded-full flex items-center justify-center shadow-neutral-200 shadow-md">
            <Ionicons name={`${showMenu ? "layers" : "layers-outline"}`} size={28} color={`${showMenu ? "#F47C25" : "black"}`} />
          </View>
        </BouncingButton>
        <BouncingButton onPress={onRecenterPress}>
          <View className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadown-neutral-200 shadow-md">
            <Ionicons name={`${isMapCentered ? "location" : "location-outline"}`} size={24} color={`${isMapCentered ? "#F47C25" : "black"}`} />
          </View>
        </BouncingButton>
      </View>
    </View>
  );
};

export default SideButtons;
