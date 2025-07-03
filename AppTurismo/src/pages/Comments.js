import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

export default function Comments({ route }) {
  const { postId } = route.params;
  const { user } = useContext(AuthContext);

  const [list, setList] = useState([]);
  const [txt, setTxt] = useState("");
  const [load, setLoad] = useState(false);

  const fetchComments = async () => {
    setLoad(true);
    const r = await fetch(`http://10.0.2.2:3000/posts/${postId}/comments`);
    setList(await r.json());
    setLoad(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchComments();
    }, [postId])
  );

  const enviar = async () => {
    if (!txt.trim()) return;
    await fetch(`http://10.0.2.2:3000/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id, texto: txt }),
    });
    setTxt("");
    fetchComments();
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Image
        source={
          item.fotoPerfil
            ? { uri: item.fotoPerfil }
            : require("../../assets/Perfil.png")
        }
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.autor}>{item.nome}</Text>
        <Text style={styles.msg}>{item.texto}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={load} onRefresh={fetchComments} />
        }
      />

      <View style={styles.sendBar}>
        <TextInput
          style={styles.input}
          placeholder="Adicionar comentário…"
          value={txt}
          onChangeText={setTxt}
        />
        <TouchableOpacity onPress={enviar}>
          <Ionicons name="send" size={26} color="#2196f3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { flexDirection: "row", marginBottom: 14 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  autor: { fontWeight: "700", marginBottom: 2 },
  msg: { color: "#333" },

  sendBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    backgroundColor: "#fafafa",
  },
  input: { flex: 1, marginRight: 10, height: 40 },
});
