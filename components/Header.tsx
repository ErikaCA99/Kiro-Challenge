import { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const options = ["Pomodoro", "Short break", "long break"];

type HeaderProps = {
  currentTime: number;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setTime: Dispatch<SetStateAction<number>>;
};

export default function Header({
  currentTime,
  setCurrentTime,
  setTime,
}: HeaderProps) {
  function handlePress(index: number) {
    const newTime = index === 0 ? 25 : index === 1 ? 5 : 15;
    setCurrentTime(index);
    setTime(newTime * 60);
  }
  return (
    <View style={{ flexDirection: "row" }}>
      {options.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(index)}
          style={[
            styles.itemStyle,
            currentTime !== index && { borderColor: "transparent" },
          ]}
        >
          <Text style={{ fontWeight: "bold" }}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  itemStyle: {
    width: "33%",
    alignItems: "center",
    borderWidth: 3,
    borderRadius: 10,
    padding: 5,
    borderColor: "white",
    marginVertical: 20,
  },
});
