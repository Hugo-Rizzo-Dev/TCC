import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  Text,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { TextInputMask } from "react-native-masked-text";

export default function SignUpScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");

  const handleSignUp = async () => {
    if (
      !nome ||
      !sobrenome ||
      !dataNascimento ||
      !genero ||
      !email ||
      !senha ||
      !confirmaSenha
    )
      return Alert.alert("Erro", "Todos os campos são obrigatórios");
    if (senha !== confirmaSenha)
      return Alert.alert("Erro", "As senhas não coincidem");
    const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dataNascimento.match(re);
    if (!match) {
      return Alert.alert("Erro", "Data deve estar no formato DD/MM/AAAA");
    }
    const [, dia, mes, ano] = match;
    const dataISO = new Date(`${ano}-${mes}-${dia}`);

    try {
      const response = await fetch("http://10.0.2.2:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          sobrenome,
          dataNascimento: dataISO,
          genero,
          email,
          senha,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Sucesso", "Usuário criado!", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
      } else {
        Alert.alert("Erro", data.message);
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Nome"
      />

      <Text style={styles.label}>Sobrenome</Text>
      <TextInput
        style={styles.input}
        value={sobrenome}
        onChangeText={setSobrenome}
        placeholder="Sobrenome"
      />

      <Text style={styles.label}>Data de Nascimento</Text>
      <TextInputMask
        type={"datetime"}
        options={{ format: "DD/MM/YYYY" }}
        value={dataNascimento}
        onChangeText={setDataNascimento}
        style={styles.input}
        placeholder="DD/MM/AAAA"
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

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Insira seu Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        placeholder="Insira sua Senha"
        secureTextEntry
      />

      <Text style={styles.label}>Confirme sua Senha</Text>
      <TextInput
        style={styles.input}
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        placeholder="Confirme sua Senha"
        secureTextEntry
      />

      <View style={styles.button}>
        <Button title="Cadastrar" onPress={handleSignUp} />
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
