import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button, useTheme, MD3Theme } from "react-native-paper";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { router } from "expo-router";

const AddEventScreen = () => {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddEvent = async () => {
    if (!title || !date) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const newEvent = {
        title,
        date,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "events"), newEvent);

      // Clear form and show success
      setTitle("");
      setDate("");
      Alert.alert("Success", "Event added successfully!", [
        {
          text: "OK",
          onPress: () => router.push("/timeline"),
        },
      ]);
    } catch (error) {
      console.error("Error adding event:", error);
      Alert.alert("Error", "Failed to add event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        mode="outlined"
        label="Event Title"
        value={title}
        onChangeText={setTitle}
        disabled={loading}
        textColor="white"
        theme={{
          colors: {
            onSurfaceVariant: "rgba(255, 255, 255, 0.7)", // Slightly transparent white for placeholder
            onSurface: "white", // Full white for input text
          },
        }}
      />
      <TextInput
        style={styles.input}
        mode="outlined"
        label="Event Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        disabled={loading}
        textColor="white"
        theme={{
          colors: {
            onSurfaceVariant: "rgba(255, 255, 255, 0.7)", // Slightly transparent white for placeholder
            onSurface: "white", // Full white for input text
          },
        }}
      />
      <Button
        mode="contained"
        onPress={handleAddEvent}
        loading={loading}
        disabled={loading}
        style={{ backgroundColor: theme.colors.primary }}
        labelStyle={{ color: "black" }}
        textColor="black"
      >
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
