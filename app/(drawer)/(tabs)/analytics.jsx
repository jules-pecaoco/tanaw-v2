import { Text, View } from "react-native";

import useWeatherData from "../../../hooks/useWeatherData";

const analytics = () => {
  const userLocation = {
    latitude: 10.653126963455296,
    longitude: 122.93849508523817,
  };
  const { weatherData, isLoading, isError, error } = useWeatherData(userLocation);

  if (isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }
  if (isError) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 items-center justify-center">
      <Text>analytics</Text>
    </View>
  );
};

export default analytics;
