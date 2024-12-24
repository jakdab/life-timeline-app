import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";

const AddEventScreen = () => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const handleAddEvent = () => {
    if (!title || !date) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    // TODO: Save event to Firebase or local data store
    Alert.alert("Success", "Event added!");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Event Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <Button title="Add Event" onPress={handleAddEvent} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});

export default AddEventScreen;
