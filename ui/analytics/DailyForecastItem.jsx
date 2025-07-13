import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { formatDate } from '../../utilities/dateTimeFormatter';

const DailyForecastItem = ({ item }) => {
  return (
    <View className="flex-col bg-secondary items-center justify-center py-3 px-2 w-[100px] mx-3 bg-background rounded-full shadow-sm">
      <Text className="text-base font-tmedium text-background text-center text-background">
        {formatDate(item.date, { format: 'relativeDay' })}
      </Text>
      <Image 
        source={{ uri: item.weather.icon }}
        style={{ width: 50, height: 50 }}
      />
      <Text className="text-2xl font-tbold text-background text-center text-background">
        {Math.round(item.heat_index)}°
      </Text>
    </View>
  );
};

export default DailyForecastItem;