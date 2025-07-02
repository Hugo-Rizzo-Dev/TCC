/*  Comments.js – versão corrigida  */
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function Comments({ route }) {
  const { postId } = route.params;
  const { user } = useContext(AuthContext);

  const [comments, setComments] = useState([]);
  const [texto, setTexto] = useState("");

  /* ---------- carrega comentários ---------- */
  const load = async () => {
    const r = await fetch(`http://10.0.2.2:3000/posts/${postId}/comments`);
    setComments(await r.json());
  };

  /* ---------- inicial ----------- */
  useEffect(() => {
    load(); // chama ao montar
  }, [postId]); // recarrega se postId mudar

  /* ---------- enviar ----------- */
  const enviar = async () => {
    if (!texto.trim()) return;
    await fetch(`http://10.0.2.2:3000/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id, texto }),
    });
    setTexto("");
    load(); // recarrega lista
  };

  /* ---------- render ---------- */
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.autor}>{item.nome}</Text>
      <Text>{item.texto}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />

      <View style={styles.sendBar}>
        <TextInput
          style={styles.input}
          placeholder="Adicionar comentário…"
          value={texto}
          onChangeText={setTexto}
        />
        <TouchableOpacity onPress={enviar}>
          <Ionicons name="send" size={24} color="#2196f3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { marginBottom: 12 },
  autor: { fontWeight: "700" },
  sendBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  input: { flex: 1, marginRight: 8, height: 40 },
});
