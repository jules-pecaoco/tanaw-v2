import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/index";

const DrawerContent = (props) => {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-5">
        <Image source={images.logo} style={{ width: 100, height: 100, borderRadius: 50 }} contentFit="cover" transition={1000} />
      </View>
      <DrawerContentScrollView {...props}>
        <DrawerItem label="Radar" onPress={() => router.navigate("/radar")} />
        <DrawerItem label="Reports" onPress={() => router.navigate("/reports")} />
        <DrawerItem label="Analytics" onPress={() => router.navigate("/analytics")} />

        <View className="h-[1px] bg-gray-500 mx-2 my-5"></View>

        <DrawerItem label="About" onPress={() => router.navigate("/about")} />
        <DrawerItem label="FAQs" onPress={() => router.navigate("/faqs")} />
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

const DrawerLayout = () => {
  const dimensions = useWindowDimensions();

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <Drawer
        drawerContent={DrawerContent}
        screenOptions={{
          drawerStyle: {
            width: dimensions.width * 0.75, // Drawer covers 75% of the screen
          },
          headerStyle: {
            backgroundColor: "#f3f4f6",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#1f2937",
          headerTitleAlign: "center",
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen
          name="about"
          options={{
            title: "About",
            headerLeft: () => {
              return (
                <View style={{ marginLeft: 16 }}>
                  <Text onPress={() => router.back()} style={{ color: "#1f2937", fontSize: 18 }}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                  </Text>
                </View>
              );
            },
          }}
        />
        <Drawer.Screen
          name="faqs"
          options={{
            title: "FAQs",
            headerLeft: () => {
              return (
                <View style={{ marginLeft: 16 }}>
                  <Text onPress={() => router.back()} style={{ color: "#1f2937", fontSize: 18 }}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                  </Text>
                </View>
              );
            },
          }}
        />
      </Drawer>
    </>
  );
};

export default DrawerLayout;
