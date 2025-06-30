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

export default function SignUpScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");

  const handleSignUp = async () => {
    console.log("Tentando cadastro:", { nome, email });
    if (!nome || !email || !senha || !confirmaSenha) {
      return Alert.alert("Erro", "Todos os campos são obrigatórios");
    }
    if (senha !== confirmaSenha) {
      return Alert.alert("Erro", "As senhas não coincidem");
    }
    try {
      const response = await fetch("http://10.0.2.2:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await response.json();

      if (response.ok) {
        console.log("Cadastro bem-sucedido:", data);
        Alert.alert("Sucesso", "Usuário criado!");
      } else {
        console.log("Erro no cadastro:", data);
        Alert.alert("Erro", data.message);
      }
    } catch (error) {
      console.log("Erro de rede:", error);
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nome</Text>
      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Insira seu Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput
        placeholder="Insira sua Senha"
        value={senha}
        onChangeText={setSenha}
        style={styles.input}
        secureTextEntry
      />

      <Text style={styles.label}>Confirme sua Senha</Text>
      <TextInput
        placeholder="Confirme sua Senha"
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        style={styles.input}
        secureTextEntry
      />

      <View style={styles.button}>
        <Button title="Cadastrar" onPress={handleSignUp} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  label: {
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  button: {
    marginTop: 10,
  },
});
