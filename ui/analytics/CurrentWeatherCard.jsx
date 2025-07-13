import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

const CurrentWeatherCard = ({ data }) => {
  if (!data) return null;
  
  return (
    <View className="bg-background p-6 rounded-3xl shadow-lg w-full">
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-primary font-tbold text-5xl">{Math.round(data.heat_index)}°</Text>
          <Text className="text-secondary font-tmedium text-lg capitalize">{data.weather.description}</Text>
        </View>
        <Image 
          source={{ uri: data.weather.icon }}
          style={{ width: 100, height: 100 }}
        />
      </View>
      <View className="flex-row items-center border-t border-gray-500">
        <Ionicons name="calendar-outline" size={16} color="#a1a1aa" />
        <Text className="text-secondary font-tregular ml-2">Today</Text>
      </View>
    </View>
  );
};

export default CurrentWeatherCard;