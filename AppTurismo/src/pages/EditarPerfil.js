import React, { useState, useEffect, useContext } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { TextInputMask } from "react-native-masked-text";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";

export default function EditProfile({ route, navigation }) {
  const { userId } = route.params;
  const { user, login } = useContext(AuthContext);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascMask, setDataNascMask] = useState("");
  const [genero, setGenero] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [tipo, setTipo] = useState("");

  /* ---------- carrega dados ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://10.0.2.2:3000/users/${userId}`);
        const u = await res.json();
        const [a, m, d] = u.dataNascimento.split("-");
        setNome(u.nome);
        setSobrenome(u.sobrenome);
        setDataNascMask(`${d}/${m}/${a}`);
        setGenero(u.genero);
        setFotoPerfil(u.fotoPerfil ?? "");
        setTipo(u.tipo ?? "");
      } catch {
        Alert.alert("Erro", "Falha ao carregar dados");
      }
    })();
  }, [userId]);

  /* ---------- salva dados de texto ---------- */
  const handleSave = async () => {
    const match = dataNascMask.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return Alert.alert("Erro", "Data em DD/MM/AAAA");
    const [, d, m, a] = match;
    const dataISO = `${a}-${m}-${d}`;

    try {
      const res = await fetch(`http://10.0.2.2:3000/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          sobrenome,
          dataNascimento: dataISO,
          genero,
          fotoPerfil,
          tipo: tipo === "" ? null : Number(tipo),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        Alert.alert("Sucesso", "Dados atualizados", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Erro", data.message);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    }
  };

  /* ---------- escolhe e faz upload do avatar ---------- */
  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;

    const form = new FormData();
    form.append("avatar", {
      uri: res.assets[0].uri,
      name: "avatar.jpg",
      type: "image/jpeg",
    });

    try {
      const r = await fetch(`http://10.0.2.2:3000/users/${user.id}/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        body: form,
      });
      const data = await r.json();
      if (r.ok) {
        setFotoPerfil(data.fotoPerfil);
        await login({ ...user, fotoPerfil: data.fotoPerfil });
      } else {
        Alert.alert("Erro", data.message);
      }
    } catch {
      Alert.alert("Erro", "Falha ao enviar imagem");
    }
  };

  /* ---------- interface ---------- */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={pickAvatar} style={{ alignSelf: "center" }}>
        <Image
          source={
            fotoPerfil
              ? { uri: fotoPerfil }
              : require("../../assets/Perfil.png")
          }
          style={{ width: 120, height: 120, borderRadius: 60 }}
        />
        <Text style={{ textAlign: "center", marginTop: 6 }}>Alterar foto</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.label}>Sobrenome</Text>
      <TextInput
        style={styles.input}
        value={sobrenome}
        onChangeText={setSobrenome}
      />

      <Text style={styles.label}>Data de Nascimento</Text>
      <TextInputMask
        type="datetime"
        options={{ format: "DD/MM/YYYY" }}
        value={dataNascMask}
        onChangeText={setDataNascMask}
        style={styles.input}
      />

      <Text style={styles.label}>Gênero</Text>
      <Picker
        selectedValue={genero}
        onValueChange={setGenero}
        style={[styles.input, { padding: 8 }]}
      >
        <Picker.Item label="Selecione..." value="" />
        <Picker.Item label="Masculino" value="M" />
        <Picker.Item label="Feminino" value="F" />
      </Picker>

      <View style={styles.button}>
        <Button title="Salvar" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, backgroundColor: "#fff" },
  label: { marginBottom: 4, fontWeight: "600" },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  button: { marginTop: 10 },
});
