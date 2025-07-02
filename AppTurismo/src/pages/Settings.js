import React, { useContext } from "react";
import {
  View,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";

const OPTIONS = [
  {
    id: "edit",
    label: "Editar cadastro",
    icon: <Ionicons name="person-circle-outline" size={24} color="#000" />,
    action: (nav, user) => nav.navigate("EditarPerfil", { userId: user.id }),
  },
  {
    id: "themes",
    label: "Editar temas",
    icon: <Ionicons name="color-palette-outline" size={24} color="#000" />,
    action: (nav) => nav.navigate("ThemeSettings"),
  },
];

export default function Settings({ navigation }) {
  const { user } = useContext(AuthContext);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.6}
      onPress={() => item.action(navigation, user)}
    >
      {item.icon}
      <Text style={styles.label}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#777" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={OPTIONS}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  label: { flex: 1, marginLeft: 16, fontSize: 16 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e0e0e0",
    marginLeft: 60,
  },
});
