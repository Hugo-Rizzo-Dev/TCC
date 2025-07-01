import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function Feed({ navigation, route }) {
  const { user } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const r = await fetch("http://10.0.2.2:3000/posts");
      const data = await r.json();
      setPosts(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const onRefresh = () => fetchPosts();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 30 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Image
                source={{ uri: item.fotoPerfil }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#ccc",
                }}
              />
              <Text style={{ marginLeft: 8, fontWeight: "600" }}>
                {item.nome} {item.sobrenome}
              </Text>
            </View>

            <Image
              source={{ uri: item.imagemUrl }}
              style={{ height: 300, borderRadius: 8, backgroundColor: "#eee" }}
            />

            {item.legenda ? <Text>{item.legenda}</Text> : null}
          </View>
        )}
      />

      {/* Botão flutuante para criar novo post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("NovoPost", { userId: user.id })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196f3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
