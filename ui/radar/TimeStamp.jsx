import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";
import useStore from "../../hooks/useStore";
import { convertUnixToISO, formatTo12HourTime } from "../../utilities/dateTimeFormatter";
import BouncingButton from "../components/BouncingButton";

const AddUnixTime = (value, interval) => {
  const newTime = value + interval;
  return newTime;
};

const TimeStamp = ({ maxPastCast, maxFutureCast, interval, url, isString = false }) => {
  const { setCurrentTileUrlTemplate } = useStore();
  const [value, setValue] = useState(isString ? Math.floor(Date.now() / 1000) : maxFutureCast);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(Math.floor(Date.now() / 1000));
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  interval = Math.floor(interval / 1000);

  if (!url) {
    return null;
  }

  // Calculate disabled states based on current values
  const leftDisabled = isString ? index <= -maxPastCast : value >= maxPastCast - 1;
  const rightDisabled = isString ? index >= maxFutureCast : value <= 0;

  const AddTimeStamp = () => {
    // Early return if already at boundary
    if (rightDisabled) return;

    if (isString) {
      setValue((prevValue) => AddUnixTime(prevValue, interval));
      setCurrentTileUrlTemplate(url + value);
    } else {
      setValue((prevValue) => prevValue - 1);
      setCurrentTileUrlTemplate(url[value]);
    }
    setIndex((prevIndex) => prevIndex + 1);
    setTime((prevTime) => prevTime + interval);
  };

  const SubstractTimeStamp = () => {
    // Early return if already at boundary
    if (leftDisabled) return;

    if (isString) {
      setValue((prevValue) => AddUnixTime(prevValue, -interval));
      setCurrentTileUrlTemplate(url + value);
    } else {
      setValue((prevValue) => prevValue + 1);
      setCurrentTileUrlTemplate(url[value]);
    }
    setIndex((prevIndex) => prevIndex - 1);
    setTime((prevTime) => prevTime - interval);
  };


  return (
    <View className="absolute bottom-[6vh] w-full h-fit flex flex-row items-center justify-center rounded-full">
      <BouncingButton
        onPressOut={() => setLeftPressed(false)}
        onPressIn={() => setLeftPressed(true)}
        onPress={SubstractTimeStamp}
        disabled={leftDisabled}
      >
        <View className={`${leftDisabled ? "bg-secondary" : "bg-background"} rounded-full p-2 shadow-secondary shadow-sm`}>
          <Ionicons name={leftDisabled ? "stop" : "caret-back"} size={30} color={"#F47C25"}></Ionicons>
        </View>
      </BouncingButton>

      <View className="px-5 py-2 bg-background rounded-full mx-2 shadow-secondary shadow-sm">
        <Text className="font-tmedium text-lg text-secondary">{formatTo12HourTime(convertUnixToISO(time))}</Text>
      </View>

      <BouncingButton
        onPressOut={() => setRightPressed(false)}
        onPressIn={() => setRightPressed(true)}
        onPress={AddTimeStamp}
        disabled={rightDisabled}
      >
        <View className={`${rightDisabled ? "bg-secondary" : "bg-background"} rounded-full p-2 shadow-secondary shadow-sm`}>
          <Ionicons name={rightDisabled ? "stop" : "caret-forward"} size={30} color={"#F47C25"}></Ionicons>
        </View>
      </BouncingButton>
    </View>
  );
};

export default TimeStamp;
