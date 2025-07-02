import React from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";

export default function ImageModal({ visible, uri, onClose }) {
  if (!uri) return null;

  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "90%",
    height: "80%",
  },
});
