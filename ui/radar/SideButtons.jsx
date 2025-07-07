import { Text, View } from "react-native";

import useStore from "../../hooks/useStore";

import BouncingButton from "../components/BouncingButton";

const SideButtons = () => {
  const { toggleMenu, showMenu } = useStore();

  return (
    <View className="absolute top-0 left-0 h-full w-24 flex flex-col items-center justify-center">
      <View className="flex flex-col items-center justify-center">
        <BouncingButton onPress={toggleMenu} className="w-24 h-24" style={{ backgroundColor: showMenu ? "lightblue" : "lightgray" }}>
          <Text>{showMenu ? "Hide Menu" : "Show Menu"}</Text>
        </BouncingButton>
        <BouncingButton onPress={() => console.log("Settings pressed")} className="w-24 h-24 mt-2" style={{ backgroundColor: "lightgray" }}>
          <Text>Settings</Text>
        </BouncingButton>
      </View>
    </View>
  );
};

export default SideButtons;
