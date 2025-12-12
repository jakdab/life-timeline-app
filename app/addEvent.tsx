import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
import { db, storage } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { router } from "expo-router";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const AddEventScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard height for dynamic button positioning
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  const pickPhotos = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to add photos."
      );
      return;
    }

    // Open image picker - limit remaining slots
    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert("Limit Reached", "Maximum 6 photos per event.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload a single image to Firebase Storage and return the download URL
  const uploadImage = async (uri: string, eventId: string, index: number): Promise<string> => {
    try {
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique filename
      const filename = `events/${eventId}/photo_${index}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload the blob
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleAddEvent = async () => {
    if (!title || !date) {
      Alert.alert("Error", "Please fill in the title and date.");
      return;
    }

    try {
      setLoading(true);
      
      // Generate a unique event ID for organizing uploads
      const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload all photos and get their download URLs
      let uploadedImageUrls: string[] = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map((photo, index) => 
          uploadImage(photo, eventId, index)
        );
        uploadedImageUrls = await Promise.all(uploadPromises);
      }
      
      const newEvent = {
        title,
        date: format(date, "yyyy-MM-dd"),
        description: description || "",
        images: uploadedImageUrls,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "events"), newEvent);

      // Clear form and navigate back
      setTitle("");
      setDate(undefined);
      setDescription("");
      setPhotos([]);
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
      keyboardVerticalOffset={48}
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

        {/* Photos Section */}
        <Text style={styles.label}>Photos (max 6)</Text>
        <View style={styles.photosGrid}>
          {/* Add Photo Button - first slot */}
          {photos.length < 6 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickPhotos}
              disabled={loading}
            >
              <IconButton
                icon="plus"
                iconColor={theme.colors.primary}
                size={24}
              />
            </TouchableOpacity>
          )}

          {/* Photo Thumbnails */}
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoThumbnail}>
              <Image
                source={{ uri: photo }}
                style={styles.photoImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <IconButton
                  icon="close"
                  iconColor="#FFFFFF"
                  size={12}
                  style={styles.removeIcon}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.buttonContainer, { bottom: keyboardHeight > 0 ? keyboardHeight : 0, paddingBottom: keyboardHeight > 0 ? 24 : 56 }]}>
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
      </View>
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
      paddingTop: 8,
      paddingHorizontal: 8,
      paddingBottom: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      color: theme.colors.primary,
      fontSize: 18,
      fontFamily: "PPNeueMontreal-Medium",
    },
    headerSpacer: {
      width: 48,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    label: {
      color: theme.colors.primary,
      fontSize: 14,
      marginBottom: 8,
      marginTop: 8,
      fontFamily: "PPNeueMontreal-Medium",
    },
    input: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    descriptionInput: {
      minHeight: 120,
    },
    photosGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 16,
    },
    photoThumbnail: {
      width: "30%",
      aspectRatio: 1,
      borderRadius: 8,
      overflow: "hidden",
      position: "relative",
    },
    photoImage: {
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    removePhotoButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    removeIcon: {
      margin: 0,
      padding: 0,
    },
    addPhotoButton: {
      width: "30%",
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },
    buttonContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 4,
    },
    buttonLabel: {
      color: "black",
      fontFamily: "PPNeueMontreal-Medium",
    },
  });

export default AddEventScreen;

