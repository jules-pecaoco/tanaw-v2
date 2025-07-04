import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar, Text, View } from "react-native";

import { images } from "@/constants/index";

const DrawerContent = (props) => {
  const pathname = usePathname();
  return (
    <View className="flex-1 bg-gray-100">
      <DrawerContentScrollView {...props}>
        <View className="p-5">
          <Image source={images.logo} style={{ width: 200, height: 100, borderRadius: 50 }} contentFit="cover" transition={100} />
        </View>
        <DrawerItem
          icon={() => <Ionicons name="compass" size={24} />}
          label="Radar"
          activeTintColor="#F47C25"
          focused={pathname === "/radar"}
          onPress={() => {
            router.navigate("/radar");
          }}
        />
        <DrawerItem
          icon={() => <Ionicons name="newspaper" size={24} />}
          label="Reports"
          activeTintColor="#F47C25"
          focused={pathname === "/reports" || pathname === "/reports/official" || pathname === "/reports/community"}
          onPress={() => {
            router.navigate("/reports");
          }}
        />
        <DrawerItem
          icon={() => <Ionicons name="add-circle" size={24} />}
          label="Report Hazard/Incident"
          activeTintColor="#F47C25"
          focused={pathname === "/report"}
          onPress={() => {
            router.navigate("/report");
          }}
        />
        <DrawerItem
          icon={() => <Ionicons name="bar-chart" size={24} />}
          label="Forecast & Analytics"
          activeTintColor="#F47C25"
          focused={pathname === "/analytics"}
          onPress={() => {
            router.navigate("/analytics");
          }}
        />

        <View className="h-[1px] bg-gray-500 mx-2 my-5"></View>

        <DrawerItem
          icon={() => <Ionicons name="information-circle" size={24} />}
          label="About"
          activeTintColor="#F47C25"
          focused={pathname === "/about"}
          onPress={() => {
            router.navigate("/about");
          }}
        />
        <DrawerItem
          icon={() => <Ionicons name="help-circle" size={24} />}
          label="FAQs"
          activeTintColor="#F47C25"
          focused={pathname === "/faqs"}
          onPress={() => {
            router.navigate("/faqs");
          }}
        />
      </DrawerContentScrollView>
    </View>
  );
};

const DrawerLayout = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <Drawer
        drawerContent={DrawerContent}
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f3f4f6",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#1f2937",
          headerTitleAlign: "center",
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
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
