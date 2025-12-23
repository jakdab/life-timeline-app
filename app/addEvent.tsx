import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Keyboard,
  Image as RNImage,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Button,
  useTheme,
  MD3Theme,
  Text,
  IconButton,
} from "react-native-paper";
import CustomTextInput from "../components/CustomTextInput";
import { DatePickerModal } from "react-native-paper-dates";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { router, useLocalSearchParams } from "expo-router";
import { format, parseISO } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";

// Type for photo items in the draggable list
type PhotoItem = {
  id: string;
  uri: string;
};

const AddEventScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    eventId?: string;
    title?: string;
    date?: string;
    description?: string;
    images?: string;
  }>();
  
  const isEditMode = !!params.eventId;
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<any>(null);
  const descriptionInputRef = useRef<any>(null);

  // Pre-populate form if in edit mode
  useEffect(() => {
    if (isEditMode && params.title) {
      setTitle(params.title);
      if (params.date) {
        setDate(parseISO(params.date));
      }
      setDescription(params.description || "");
      if (params.images) {
        try {
          // First decode the URI-encoded JSON string, then parse it
          const decodedString = decodeURIComponent(params.images);
          console.log("Decoded images string:", decodedString);
          const parsedImages = JSON.parse(decodedString);
          console.log("Parsed images:", parsedImages);
          setPhotos(parsedImages);
        } catch (e) {
          console.log("Error parsing images:", e);
          setPhotos([]);
        }
      }
    }
  }, [isEditMode, params.title, params.date, params.description, params.images]);

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
      
      // For uploads, use existing event ID or generate new one
      const uploadEventId = params.eventId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload new photos (those that don't start with https://)
      // Keep existing URLs as-is
      let finalImageUrls: string[] = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map(async (photo, index) => {
          if (photo.startsWith("https://")) {
            // Already uploaded to Firebase Storage, keep URL
            return photo;
          } else {
            // New local photo, upload it
            return await uploadImage(photo, uploadEventId, index);
          }
        });
        finalImageUrls = await Promise.all(uploadPromises);
      }
      
      const eventData = {
        title,
        date: format(date, "yyyy-MM-dd"),
        description: description || "",
        images: finalImageUrls,
        ...(isEditMode ? {} : { createdAt: new Date().toISOString() }),
      };

      if (isEditMode && params.eventId) {
        // Update existing event
        await updateDoc(doc(db, "events", params.eventId), eventData);
      } else {
        // Create new event
        await addDoc(collection(db, "events"), {
          ...eventData,
          createdAt: new Date().toISOString(),
        });
      }

      // Clear form and navigate back to timeline with the event date
      const savedDate = format(date, "yyyy-MM-dd");
      setTitle("");
      setDate(undefined);
      setDescription("");
      setPhotos([]);
      
      // Navigate to timeline with scrollToDate parameter
      router.replace({
        pathname: "/(tabs)/timeline",
        params: { scrollToDate: savedDate },
      });
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

  // Render function for draggable photo items
  const renderPhotoItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<PhotoItem>) => {
      const index = photos.findIndex((p) => p === item.uri);
      return (
        <ScaleDecorator>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.photoThumbnail,
              isActive && styles.photoThumbnailActive,
            ]}
          >
            <RNImage
              source={{ uri: item.uri }}
              style={styles.photoImage}
              resizeMode="cover"
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
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [photos]
  );


  return (
    <View style={styles.container}>
      {/* Header with X button */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          iconColor={theme.colors.primary}
          size={28}
          onPress={handleClose}
        />
        <Text style={styles.headerTitle}>{isEditMode ? "Edit Event" : "Add Event"}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={150}
        enableAutomaticScroll={true}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <CustomTextInput
          label="Event Title"
          placeholder="Enter event title"
          value={title}
          onChangeText={setTitle}
          disabled={loading}
        />

        {/* Date Picker */}
        <TouchableOpacity
          onPress={() => setDatePickerOpen(true)}
          disabled={loading}
        >
          <View pointerEvents="none">
            <CustomTextInput
              label="Event Date"
              placeholder="Select a date"
              value={date ? format(date, "MMMM d, yyyy") : ""}
              editable={false}
              rightIcon="calendar"
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
        <CustomTextInput
          ref={descriptionInputRef}
          label="Description"
          placeholder="Enter event description (optional)"
          value={description}
          onChangeText={setDescription}
          disabled={loading}
          multiline
          numberOfLines={5}
          onFocus={() => {
            // Manually scroll to this input on focus
            setTimeout(() => {
              scrollViewRef.current?.scrollToPosition(0, 180, true);
            }, 100);
          }}
        />

        {/* Photos Section */}
        <Text style={styles.label}>Photos (max 6)</Text>
        <View style={styles.photosGrid}>
          {/* Photo Thumbnails */}
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoThumbnail}>
              <RNImage
                source={{ uri: photo }}
                style={styles.photoImage}
                resizeMode="cover"
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

          {/* Add Photo Button - after photos */}
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
        </View>
      </KeyboardAwareScrollView>

      {/* Gradient Fade Overlay - Bottom (below save button, above content) */}
      <LinearGradient
        colors={["rgba(15, 15, 15, 0)", "#0f0f0f"]}
        style={[
          styles.gradientOverlayBottom,
          { bottom: keyboardHeight > 0 ? keyboardHeight : 0 }
        ]}
        pointerEvents="none"
      />

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
          {isEditMode ? "Save Changes" : "Add Event"}
        </Button>
      </View>
    </View>
  );
};

// Calculate photo thumbnail size based on screen width
const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_GAP = 16;
const PHOTO_PADDING = 40; // 20px padding on each side
const PHOTO_SIZE = Math.floor((SCREEN_WIDTH - PHOTO_PADDING - (2 * PHOTO_GAP)) / 3);

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
      paddingTop: 24,
      paddingBottom: 120,
    },
    label: {
      fontFamily: "PPNeueMontreal-Book",
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0.14,
      color: "#e8e8eb",
      marginBottom: 4,
    },
    photosGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: PHOTO_GAP,
      marginBottom: 16,
    },
    photoThumbnail: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: 8,
      overflow: "hidden",
      position: "relative",
    },
    photoImage: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
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
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#121111",
    },
    addPhotoButtonInline: {
      marginLeft: PHOTO_GAP,
    },
    photosContainer: {
      marginBottom: 16,
    },
    photoThumbnailActive: {
      opacity: 0.9,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 10,
    },
    draggableContent: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: PHOTO_GAP,
    },
    gradientOverlayBottom: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 200,
      zIndex: 1,
    },
    buttonContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 32,
      paddingTop: 16,
      paddingBottom: 24,
      zIndex: 2,
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

