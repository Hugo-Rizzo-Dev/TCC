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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = async () => {
    if (!email || !senha) {
      return Alert.alert("Erro", "Email e senha são obrigatórios");
    }
    try {
      const response = await fetch("http://10.0.2.2:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();

      if (response.ok) {
        navigation.replace("Feed", { user: data.user });
      } else {
        Alert.alert("Erro", data.message);
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Insira seu Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Insira sua Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <View style={styles.button}>
        <Button title="Entrar" onPress={handleLogin} />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button
          title="Criar uma conta"
          onPress={() => navigation.navigate("Cadastro")}
        />
      </View>

      {/* Botão temporario*/}
      <View style={{ marginTop: 10 }}>
        <Button
          title="Testar Editar Perfil"
          color="#888"
          onPress={() =>
            navigation.navigate("EditarPerfil", {
              userId: "5D7402E9-51A9-420F-96BC-1DB434CB399F", // ← troque pelo seu UUID
            })
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
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
