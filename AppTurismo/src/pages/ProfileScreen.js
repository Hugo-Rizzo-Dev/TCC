import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import ImageModal from "../components/ImageModal";

const numColumns = 3;
const size = Dimensions.get("window").width / numColumns;

export default function ProfileScreen({ route }) {
  const { userId } = route.params;
  const { user: logged } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUri, setSelectedUri] = useState(null);

  useEffect(() => {
    (async () => {
      const uRes = await fetch(`http://10.0.2.2:3000/users/${userId}`);
      const user = await uRes.json();
      setProfile(user);

      const pRes = await fetch(`http://10.0.2.2:3000/users/${userId}/posts`);
      const list = await pRes.json();
      setPosts(list);

      const cRes = await fetch(
        `http://10.0.2.2:3000/users/${userId}/followers/count`
      );
      const { total } = await cRes.json();
      setFollowers(total);

      if (logged.id !== userId) {
        const sRes = await fetch(
          `http://10.0.2.2:3000/follow/status?seguidorId=${logged.id}&seguidoId=${userId}`
        );
        const { following } = await sRes.json();
        setIsFollowing(following);
      }
    })();
  }, [userId]);

  if (!profile) return null;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        setSelectedUri(item.imagemUrl);
        setModalVisible(true);
      }}
    >
      <Image source={{ uri: item.imagemUrl }} style={styles.cell} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ImageModal
          visible={modalVisible}
          uri={selectedUri}
          onClose={() => setModalVisible(false)}
        />

        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={styles.name}>
            {profile.nome} {profile.sobrenome ?? ""}
          </Text>

          <Text style={styles.bio}>{profile.bio ?? ""}</Text>

          <View style={styles.counters}>
            <Text style={styles.counter}>{posts.length} Posts</Text>
            <Text style={styles.counter}>{followers} Seguidores</Text>
          </View>

          {logged.id !== userId && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.unfollowBtn]}
              onPress={async () => {
                const url = "http://10.0.2.2:3000/follow";
                const opts = {
                  method: isFollowing ? "DELETE" : "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    seguidorId: logged.id,
                    seguidoId: userId,
                  }),
                };
                await fetch(url, opts);

                setIsFollowing(!isFollowing);
                setFollowers((prev) => prev + (isFollowing ? -1 : +1));
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {isFollowing ? "Deixar de seguir" : "Seguir"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", padding: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ccc" },
  name: { fontSize: 18, fontWeight: "700" },
  bio: { marginTop: 4, color: "#555" },
  counters: { flexDirection: "row", marginTop: 8 },
  counter: { marginRight: 16, fontWeight: "600" },
  cell: { width: size, height: size, marginBottom: 2 },
  followBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: "#2196f3",
    alignSelf: "flex-start",
  },
  unfollowBtn: { backgroundColor: "#9e9e9e" },
});
