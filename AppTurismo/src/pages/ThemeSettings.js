import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ThemeSettings() {
  const [dark, setDark] = useState(false);
  const [intensity, setIntensity] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Ionicons name="sunny-outline" size={22} color="#000" />
        <Text style={styles.label}>Tema escuro</Text>
        <Switch value={dark} onValueChange={setDark} />
      </View>

      <View style={styles.item}>
        <Ionicons name="contrast-outline" size={22} color="#000" />
        <Text style={styles.label}>Intensidade alta</Text>
        <Switch value={intensity} onValueChange={setIntensity} />
      </View>

      {/* Aqui salvaremos em AsyncStorage ou contexto futuramente */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  label: { flex: 1, marginLeft: 16, fontSize: 16 },
});
