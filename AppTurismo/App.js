import "react-native-gesture-handler";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, AuthContext } from "./src/context/AuthContext";

import LoginScreen from "./src/pages/Login";
import SignUpScreen from "./src/pages/Cadastro";
import EditProfile from "./src/pages/EditarPerfil";
import Feed from "./src/pages/Feed";
import NovoPost from "./src/pages/NovoPost";
import Settings from "./src/pages/Settings";
import ThemeSettings from "./src/pages/ThemeSettings";
import ProfileScreen from "./src/pages/ProfileScreen";
import Comments from "./src/pages/Comments";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { user } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props}>
      <TouchableOpacity
        style={dStyles.card}
        activeOpacity={0.7}
        onPress={() => {
          props.navigation.closeDrawer();
          props.navigation.navigate("Profile", { userId: user.id });
        }}
      >
        <Image
          source={
            user.fotoPerfil
              ? { uri: user.fotoPerfil }
              : require("./assets/Perfil.png")
          }
          style={dStyles.avatar}
        />
        <Text style={dStyles.name}>{`${user.nome} ${
          user.sobrenome ?? ""
        }`}</Text>
      </TouchableOpacity>

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function AppDrawer() {
  const { logout } = useContext(AuthContext);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={navigation.toggleDrawer}
            style={{ paddingHorizontal: 12 }}
          >
            <Ionicons name="menu" size={24} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ paddingHorizontal: 12 }}>
            <Ionicons name="log-out-outline" size={24} />
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen
        name="Feed"
        component={Feed}
        options={{ drawerLabel: "Início", headerTitle: () => null }}
      />
      <Drawer.Screen
        name="Settings"
        component={Settings}
        options={{ drawerLabel: "Configurações", title: "Configurações" }}
      />
    </Drawer.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeDrawer"
        component={AppDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NovoPost"
        component={NovoPost}
        options={{ title: "Novo Post" }}
      />
      <Stack.Screen
        name="EditarPerfil"
        component={EditProfile}
        options={{ title: "Editar cadastro" }}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettings}
        options={{ title: "Editar temas" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
      <Stack.Screen
        name="Comments"
        component={Comments}
        options={{ title: "Comentários" }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Entrar" }}
      />
      <Stack.Screen
        name="Cadastro"
        component={SignUpScreen}
        options={{ title: "Criar conta" }}
      />
    </Stack.Navigator>
  );
}

function Router() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <Router />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const dStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#ccc" },
  name: { marginLeft: 12, fontSize: 16, fontWeight: "600" },
});
