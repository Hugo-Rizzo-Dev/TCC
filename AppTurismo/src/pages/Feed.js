import React, { useState, useCallback, useContext } from "react";
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

import { AuthContext } from "../context/AuthContext";
import ImageModal from "../components/ImageModal";

export default function Feed({ navigation }) {
  const { user } = useContext(AuthContext);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState({});
  const [modalUri, setModalUri] = useState(null);

  /* ----------- carrega feed ----------- */
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const r = await fetch(`http://10.0.2.2:3000/posts?uid=${user.id}`);
      const arr = await r.json();
      setPosts(arr);

      const curti = {};
      arr.forEach((p) => {
        if (p.curtiu) curti[p.id] = true;
      });
      setLiked(curti);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- curtir / descurtir ---------- */
  const toggleLike = async (postId) => {
    const jaCurti = liked[postId];

    await fetch(`http://10.0.2.2:3000/posts/${postId}/like`, {
      method: jaCurti ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id }),
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + (jaCurti ? -1 : +1) } : p
      )
    );
    setLiked((prev) => ({ ...prev, [postId]: !jaCurti }));
  };

  /* ---------- carrega ao focar ---------- */
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  /* ---------- render de cada post ---------- */
  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 30 }}>
      {/* cabeçalho */}
      <TouchableOpacity
        style={styles.head}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("Profile", { userId: item.autorId })}
      >
        <Image source={{ uri: item.fotoPerfil }} style={styles.avatar} />
        <Text style={styles.author}>
          {item.nome} {item.sobrenome}
        </Text>
      </TouchableOpacity>

      {/* imagem */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalUri(item.imagemUrl)}
      >
        <Image source={{ uri: item.imagemUrl }} style={styles.photo} />
      </TouchableOpacity>

      {/* ações */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleLike(item.id)}>
          <Ionicons
            name={liked[item.id] ? "thumbs-up" : "thumbs-up-outline"}
            size={24}
            color={liked[item.id] ? "#2196f3" : "#444"}
          />
        </TouchableOpacity>
        <Text style={styles.likesTxt}>{item.likes ?? 0}</Text>

        <TouchableOpacity
          style={{ marginLeft: 20 }}
          onPress={() => navigation.navigate("Comments", { postId: item.id })}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#444" />
        </TouchableOpacity>
      </View>

      {item.legenda ? <Text>{item.legenda}</Text> : null}
    </View>
  );

  /* ---------- UI ---------- */
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPosts} />
        }
        renderItem={renderItem}
      />

      <ImageModal
        visible={!!modalUri}
        uri={modalUri}
        onClose={() => setModalUri(null)}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("NovoPost", { userId: user.id })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#ccc" },
  author: { marginLeft: 8, fontWeight: "600" },

  photo: { height: 300, borderRadius: 8, backgroundColor: "#eee" },

  actions: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  likesTxt: { marginLeft: 4, fontWeight: "500" },

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
