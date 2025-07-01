import React, { useState } from "react";
import { View, Button, Image, TextInput, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function NovoPost({ route, navigation }) {
  const { userId } = route.params;
  const [foto, setFoto] = useState(null);
  const [legenda, setLegenda] = useState("");

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) setFoto(res.assets[0]);
  };

  const handleEnviar = async () => {
    if (!foto) return Alert.alert("Escolha uma imagem");
    const data = new FormData();
    data.append("foto", {
      uri: foto.uri,
      name: "foto.jpg",
      type: "image/jpeg",
    });
    data.append("usuarioId", userId);
    data.append("legenda", legenda);

    const r = await fetch("http://10.0.2.2:3000/posts", {
      method: "POST",
      body: data,
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (r.ok) {
      Alert.alert("Publicado!");
      navigation.goBack();
    } else {
      Alert.alert("Erro ao publicar");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {foto && <Image source={{ uri: foto.uri }} style={{ height: 300 }} />}
      <Button title="Selecionar Foto" onPress={pickImage} />
      <TextInput
        placeholder="Legenda (opcional)"
        value={legenda}
        onChangeText={setLegenda}
      />
      <Button title="Publicar" onPress={handleEnviar} />
    </View>
  );
}
