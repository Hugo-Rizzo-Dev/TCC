import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/pages/Login";
import SignUpScreen from "./src/pages/Cadastro";
import EditProfile from "./src/pages/EditarPerfil";
import Feed from "./src/pages/Feed";
import NovoPost from "./src/pages/NovoPost";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Entrar" }}
        />
        <Stack.Screen
          name="Cadastro"
          component={SignUpScreen}
          options={{ title: "Criar Conta" }}
        />
        <Stack.Screen
          name="EditarPerfil"
          component={EditProfile}
          options={{ title: "Editar Cadastro" }}
        />
        <Stack.Screen
          name="Feed"
          component={Feed}
          options={{ title: "Feed" }}
        />
        <Stack.Screen
          name="NovoPost"
          component={NovoPost}
          options={{ title: "Novo Post" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
