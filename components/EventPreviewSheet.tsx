import React, { useCallback, useMemo, forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";

interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  images?: string[];
  createdAt: string;
}

interface EventPreviewSheetProps {
  event: Event | null;
  onClose: () => void;
  onEdit: (event: Event) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const EventPreviewSheet = forwardRef<BottomSheet, EventPreviewSheetProps>(
  ({ event, onClose, onEdit }, ref) => {
    // Snap points: 70% (2/3 screen) and 100% of screen
    const snapPoints = useMemo(() => ["70%", "100%"], []);

    const handleEditPress = useCallback(() => {
      if (event) {
        Alert.alert("Edit Event", "Edit functionality coming soon!");
      }
    }, [event]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const formatDate = (dateString: string) => {
      try {
        const date = parseISO(dateString);
        return format(date, "MMMM d, yyyy");
      } catch {
        return dateString;
      }
    };

    if (!event) return null;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onClose={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
        containerStyle={styles.sheetContainer}
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* Header with close and edit buttons */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={24} color="#E6E6E6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="dots-horizontal"
                size={24}
                color="#E6E6E6"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Carousel */}
            {event.images && event.images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.carouselContainer}
                contentContainerStyle={styles.carouselContent}
              >
                {event.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.carouselImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            )}

            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Date */}
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={20}
                color="#7D7D8A"
              />
              <Text style={styles.dateText}>{formatDate(event.date)}</Text>
            </View>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Description */}
            {event.description && event.description.trim() !== "" && (
              <Text style={styles.description}>{event.description}</Text>
            )}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetContainer: {
    zIndex: 999, // Ensure sheet appears above all timeline content
  },
  handleIndicator: {
    backgroundColor: "#7D7D8A",
    width: 40,
    height: 4,
  },
  sheetBackground: {
    backgroundColor: "#151515",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  carouselContainer: {
    marginBottom: 16,
  },
  carouselContent: {
    gap: 12,
  },
  carouselImage: {
    width: SCREEN_WIDTH - 64,
    height: 200,
    borderRadius: 12,
  },
  title: {
    fontFamily: "PPNeueMontreal-Medium",
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontFamily: "PPNeueMontreal-Book",
    fontSize: 16,
    color: "#7D7D8A",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#252525",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontFamily: "PPNeueMontreal-Medium",
    fontSize: 12,
    color: "#E6E6E6",
    textTransform: "uppercase",
  },
  description: {
    fontFamily: "PPNeueMontreal-Book",
    fontSize: 16,
    color: "#E6E6E6",
    lineHeight: 24,
  },
});

export default EventPreviewSheet;
