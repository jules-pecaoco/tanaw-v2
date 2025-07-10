import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";


import { images } from "@/constants/index";


function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <LinearGradient locations={[0.05, 0.1, 0.4, 0.6]} className="h-full w-full" colors={["#E84E4C", "#f47c25", "#FFFFFF", "#3c454c"]}>
        <View className="flex-1 items-center justify-end h-full w-full pb-20">
          <Image
            style={{
              borderRadius: 16,
              width: 256,
              height: 256,
              margin: 0,
              padding: 0,
            }}
            // tintColor={"#ffffff"}
            source={images.logo}
            contentFit="cover"
          />
          <Text className="font-tbold text-gray-400 text-center">WELCOME</Text>
          <Text className="font-tbold text-gray-300 text-center text-3xl mx-12 mt-5">On top of the risks, so you don’t have to be!</Text>
          <Text className="font-tregular text-gray-400 text-center mx-12 mt-5">
            Welcome to Tanaw, your essential tool for monitoring heat index levels and flood risks in your area. Be prepared, stay informed, and
            protect your community.
          </Text>
          <View className="my-8"></View>
          <View className="h-fit w-[70%]">
            <TouchableOpacity
              className="bg-white text-center py-3 rounded-full font-rsemibold"
              onPress={() => {
                router.push("location");
              }}
            >
              <Text className="text-center">Let's Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default Index;
