import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button, useTheme, MD3Theme } from "react-native-paper";

const AddEventScreen = () => {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const handleAddEvent = () => {
    if (!title || !date) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    // TODO: Save event to Firebase
    Alert.alert("Success", "Event added!");
  };

  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { fontFamily: "PPNeueMontreal-Medium" }]}
        mode="outlined"
        label="Event Title"
        value={title}
        onChangeText={setTitle}
        theme={{ colors: { placeholder: theme.colors.secondary } }}
      />
      <TextInput
        style={styles.input}
        mode="outlined"
        label="Event Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        theme={{ colors: { placeholder: theme.colors.secondary } }}
      />
      <Button mode="contained" onPress={handleAddEvent}>
        Add Event
      </Button>
    </View>
  );
};

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    input: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
  });

export default AddEventScreen;
