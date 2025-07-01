import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { TextInputMask } from "react-native-masked-text";

export default function EditProfile({ route, navigation }) {
  const { userId } = route.params;

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascMask, setDataNascMask] = useState(""); // DD/MM/AAAA
  const [genero, setGenero] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [tipo, setTipo] = useState("");

  /* ─────── carregar dados atuais ─────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://10.0.2.2:3000/users/${userId}`);
        const u = await res.json();
        // converte YYYY-MM-DD → DD/MM/AAAA
        const [a, m, d] = u.dataNascimento.split("-");
        setNome(u.nome);
        setSobrenome(u.sobrenome);
        setDataNascMask(`${d}/${m}/${a}`);
        setGenero(u.genero);
        setFotoPerfil(u.fotoPerfil ?? "");
        setTipo(u.tipo ?? "");
      } catch (err) {
        Alert.alert("Erro", "Falha ao carregar dados");
      }
    })();
  }, [userId]);

  /* ─────── salvar alterações ─────── */
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        type={"datetime"}
        options={{ format: "DD/MM/YYYY" }}
        value={dataNascMask}
        onChangeText={setDataNascMask}
        style={styles.input}
      />

      <Text style={styles.label}>Gênero</Text>
      <Picker
        selectedValue={genero}
        onValueChange={setGenero}
        style={styles.input}
      >
        <Picker.Item label="Selecione..." value="" />
        <Picker.Item label="Masculino" value="M" />
        <Picker.Item label="Feminino" value="F" />
      </Picker>

      <Text style={styles.label}>Foto (URL)</Text>
      <TextInput
        style={styles.input}
        value={fotoPerfil}
        onChangeText={setFotoPerfil}
      />

      <Text style={styles.label}>Tipo (número opcional)</Text>
      <TextInput
        style={styles.input}
        value={tipo.toString()}
        onChangeText={setTipo}
        keyboardType="numeric"
      />

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
