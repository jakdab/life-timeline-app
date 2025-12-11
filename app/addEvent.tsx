import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  useTheme,
  MD3Theme,
  Text,
  IconButton,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { router } from "expo-router";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AddEventScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleClose = () => {
    router.back();
  };

  const handleAddEvent = async () => {
    if (!title || !date) {
      Alert.alert("Error", "Please fill in the title and date.");
      return;
    }

    try {
      setLoading(true);
      const newEvent = {
        title,
        date: format(date, "yyyy-MM-dd"),
        description: description || "",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "events"), newEvent);

      // Clear form and navigate back
      setTitle("");
      setDate(undefined);
      setDescription("");
      Alert.alert("Success", "Event added successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error adding event:", error);
      Alert.alert("Error", "Failed to add event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onConfirmDate = ({ date }: { date: Date | undefined }) => {
    setDatePickerOpen(false);
    if (date) {
      setDate(date);
    }
  };

  const styles = makeStyles(theme, insets.top);

  const inputTheme = {
    colors: {
      onSurfaceVariant: "rgba(255, 255, 255, 0.7)",
      onSurface: "white",
    },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header with X button */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          iconColor={theme.colors.primary}
          size={28}
          onPress={handleClose}
        />
        <Text style={styles.headerTitle}>Add Event</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input */}
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          mode="outlined"
          placeholder="Enter event title"
          value={title}
          onChangeText={setTitle}
          disabled={loading}
          textColor="white"
          theme={inputTheme}
        />

        {/* Date Picker */}
        <Text style={styles.label}>Event Date</Text>
        <TouchableOpacity
          onPress={() => setDatePickerOpen(true)}
          disabled={loading}
        >
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              mode="outlined"
              placeholder="Select a date"
              value={date ? format(date, "MMMM d, yyyy") : ""}
              editable={false}
              textColor="white"
              theme={inputTheme}
              right={<TextInput.Icon icon="calendar" color="white" />}
            />
          </View>
        </TouchableOpacity>

        <DatePickerModal
          locale="en"
          mode="single"
          visible={datePickerOpen}
          onDismiss={() => setDatePickerOpen(false)}
          date={date}
          onConfirm={onConfirmDate}
        />

        {/* Description Input */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          mode="outlined"
          placeholder="Enter event description (optional)"
          value={description}
          onChangeText={setDescription}
          disabled={loading}
          textColor="white"
          theme={inputTheme}
          multiline
          numberOfLines={5}
        />

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleAddEvent}
          loading={loading}
          disabled={loading}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          textColor="black"
        >
          Add Event
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (theme: MD3Theme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: topInset,
      paddingHorizontal: 8,
      paddingBottom: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: "600",
    },
    headerSpacer: {
      width: 48, // Same as IconButton to balance the header
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    label: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 8,
    },
    input: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    descriptionInput: {
      minHeight: 120,
    },
    button: {
      marginTop: 16,
      backgroundColor: theme.colors.primary,
      paddingVertical: 4,
    },
    buttonLabel: {
      color: "black",
      fontWeight: "600",
    },
  });

export default AddEventScreen;
