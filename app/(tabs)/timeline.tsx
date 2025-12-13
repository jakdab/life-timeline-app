import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useTheme, MD3Theme } from "react-native-paper";
import {
  format,
  parseISO,
  addDays,
  startOfToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Swipeable } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

// Custom hook to calculate image brightness and return appropriate opacity
// FUTURE IMPLEMENTATION: Uncomment when not using Expo Go (requires dev build)
// ============================================================================
// import { getColors } from "react-native-image-colors";
//
// const useImageBrightness = (imageUrl: string | null) => {
//   const [opacity, setOpacity] = useState(0.10);
//
//   useEffect(() => {
//     if (!imageUrl) return;
//
//     const calculateBrightness = async () => {
//       try {
//         const colors = await getColors(imageUrl, {
//           fallback: "#000000",
//           cache: true,
//           key: imageUrl,
//         });
//
//         let dominantHex = "#808080";
//         if (colors.platform === "ios") {
//           dominantHex = colors.background || colors.primary || "#808080";
//         } else if (colors.platform === "android") {
//           dominantHex = colors.dominant || colors.average || "#808080";
//         } else if (colors.platform === "web") {
//           dominantHex = colors.dominant || colors.vibrant || "#808080";
//         }
//
//         const hex = dominantHex.replace("#", "");
//         const r = parseInt(hex.substring(0, 2), 16);
//         const g = parseInt(hex.substring(2, 4), 16);
//         const b = parseInt(hex.substring(4, 6), 16);
//
//         // Luminance formula: 0.299*R + 0.587*G + 0.114*B
//         const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
//         // Dark image (< 128): higher opacity, Light image (>= 128): lower opacity
//         const calculatedOpacity = luminance < 128 ? 0.21 : 0.08;
//         setOpacity(calculatedOpacity);
//       } catch (error) {
//         setOpacity(0.10);
//       }
//     };
//     calculateBrightness();
//   }, [imageUrl]);
//
//   return opacity;
// };
// ============================================================================

// Current simple implementation (works with Expo Go)
const useImageBrightness = (_imageUrl: string | null) => {
  // Static opacity - middle ground between dark (0.21) and light (0.08)
  return 0.12;
};

// Define the Event type
interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  images?: string[];
  createdAt: string;
}

const CalendarPreview = ({
  onDateSelect,
  selectedDate,
}: {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const today = startOfToday();

  // Generate array of days (6 months before and 6 months after today)
  const generateDays = () => {
    const startDate = subMonths(today, 6);
    const endDate = addMonths(today, 6);
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    return days;
  };

  const days = generateDays();
  const todayIndex = days.findIndex(
    (date) => format(date, "d MMM yyyy") === format(today, "d MMM yyyy")
  );

  const renderDay = ({ item: date }: { item: Date }) => {
    const isSelected =
      format(date, "d MMM yyyy") === format(selectedDate, "d MMM yyyy");
    const isFirstOfMonth = format(date, "d") === "1";

    return (
      <TouchableOpacity
        onPress={() => onDateSelect(date)}
        style={[
          styles.dayColumn,
          isSelected && styles.todayColumn,
          isFirstOfMonth && styles.firstOfMonth,
        ]}
      >
        <Text style={[styles.dayName, isSelected && styles.todayText]}>
          {format(date, "EEE")}
        </Text>
        <Text style={[styles.dayNumber, isSelected && styles.todayText]}>
          {format(date, "d")}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.calendarContainer}>
      <FlatList
        horizontal
        data={days}
        renderItem={renderDay}
        keyExtractor={(date) => date.toISOString()}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={todayIndex - 2}
        getItemLayout={(data, index) => ({
          length: 64,
          offset: 64 * index,
          index,
        })}
        contentContainerStyle={styles.daysRow}
        initialNumToRender={30}
        maxToRenderPerBatch={30}
        windowSize={15}
      />
    </View>
  );
};

const TimelineScreen = () => {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const timelineRef = useRef<FlatList>(null);

  useEffect(() => {
    // Changed to ascending order (oldest first)
    const q = query(collection(db, "events"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedEvents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];
        setEvents(updatedEvents);
      },
      (error) => {
        console.error("Error fetching events:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
      Alert.alert("Error", "Failed to delete event. Please try again.");
    }
  };

  const styles = makeStyles(theme);

  // Group events by month
  const groupedEvents = events.reduce(
    (groups: { [key: string]: Event[] }, event) => {
      const date = parseISO(event.date);
      const monthYear = format(date, "MMMM yyyy");

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(event);
      return groups;
    },
    {}
  );

  // Sort events within each month in reverse chronological order
  // For same-day events, sort by createdAt in ASCENDING order (older first, newer below)
  Object.keys(groupedEvents).forEach((month) => {
    groupedEvents[month].sort((a, b) => {
      const dateCompare = parseISO(b.date).getTime() - parseISO(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // Same day: sort by createdAt ascending (older events first, newer below)
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aCreated - bCreated;
    });
  });

  // Convert to array and sort months in reverse chronological order (newest to oldest)
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => {
    return (
      parseISO(groupedEvents[b][0].date).getTime() -
      parseISO(groupedEvents[a][0].date).getTime()
    );
  });

  // Flatten the grouped events with month separators
  const flatListData = sortedMonths.flatMap((month) => [
    ...groupedEvents[month],
    month,
  ]);

  const renderMonthSeparator = (month: string) => (
    <View style={styles.monthSeparator}>
      <Text style={styles.monthText}>{month}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Event | string }) => {
    if (typeof item === "string") {
      return renderMonthSeparator(item);
    }
    return <EventCard event={item} onDelete={handleDeleteEvent} onEdit={handleEditEvent} />;
  };

  const handleEditEvent = (event: Event) => {
    // Encode images JSON to prevent Firebase Storage URL params from being corrupted
    const encodedImages = encodeURIComponent(JSON.stringify(event.images || []));
    router.push({
      pathname: "/addEvent",
      params: {
        eventId: event.id,
        title: event.title,
        date: event.date,
        description: event.description || "",
        images: encodedImages,
      },
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);

    // Convert selected date to timestamp for comparison
    const selectedTimestamp = date.getTime();

    // Find the index of the exact date match or the closest date
    let closestIndex = -1;
    let smallestDiff = Infinity;

    flatListData.forEach((item, index) => {
      if (typeof item === "string") return; // Skip month headers

      const eventDate = parseISO(item.date);
      const diff = Math.abs(eventDate.getTime() - selectedTimestamp);

      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = index;
      }
    });

    if (closestIndex !== -1) {
      // Scroll to the closest event
      timelineRef.current?.scrollToIndex({
        index: closestIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  return (
    <View style={styles.container}>
      <CalendarPreview
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
      <View style={styles.timelineLine} />
      <FlatList
        ref={timelineRef}
        data={flatListData}
        inverted
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => (typeof item === "string" ? item : item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.eventList,
          { flexGrow: 1, justifyContent: "flex-end", paddingTop: 80 },
        ]}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            timelineRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          }, 100);
        }}
      />
      {/* Gradient Fade Overlay - Top */}
      <LinearGradient
        colors={["#0f0f0f", "rgba(15, 15, 15, 0)"]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
      {/* Gradient Fade Overlay - Bottom */}
      <LinearGradient
        colors={["rgba(15, 15, 15, 0)", "#0f0f0f"]}
        style={styles.gradientOverlayBottom}
        pointerEvents="none"
      />
      {/* Floating Add Event Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/addEvent")}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const EventCard = ({
  event,
  onDelete,
  onEdit,
}: {
  event: Event;
  onDelete: (id: string) => void;
  onEdit: (event: Event) => void;
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(event.id),
        },
      ]
    );
  };

  const handleEdit = () => {
    swipeableRef.current?.close();
    onEdit(event);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [-160, -80, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          onPress={handleEdit}
          style={styles.editButtonContainer}
        >
          <Animated.View
            style={[styles.editButton, { opacity, transform: [{ scale }] }]}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButtonContainer}
        >
          <Animated.View
            style={[styles.deleteButton, { opacity, transform: [{ scale }] }]}
          >
            <MaterialCommunityIcons name="trash-can" size={24} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  // Check if we have images for the blur background
  const hasImages = event.images && event.images.length > 0;
  const firstImage = hasImages ? event.images![0] : null;
  
  // Get dynamic opacity based on image brightness
  const blurOpacity = useImageBrightness(firstImage);

  return (
    <View style={styles.card}>
      {/* Blurred Background Image with MaskedView for smooth edges */}
      {firstImage && (
        <View style={styles.blurImageContainer}>
          <MaskedView
            style={styles.maskedView}
            maskElement={
              <Svg width="100%" height="100%">
                <Defs>
                  <RadialGradient
                    id="fadeGradient"
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                  >
                    <Stop offset="0%" stopColor="white" stopOpacity="1" />
                    <Stop offset="40%" stopColor="white" stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="white" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#fadeGradient)"
                />
              </Svg>
            }
          >
            <Image
              source={{ uri: firstImage }}
              style={[styles.blurImage, { opacity: blurOpacity }]}
              contentFit="cover"
              blurRadius={400}
            />
          </MaskedView>
        </View>
      )}

      {/* Date Circle - stays fixed */}
      <View style={styles.dateCircle}>
        <Text style={styles.dateText}>{new Date(event.date).getDate()}</Text>
      </View>

      {/* Swipeable Card Content */}
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        friction={2}
        overshootRight={false}
        containerStyle={styles.swipeableContainer}
      >
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.tags && event.tags.length > 0 && (
            <EventTags tags={event.tags} />
          )}

          {/* Photo Row - after tags, before description per Figma */}
          {event.images && event.images.length > 0 && (
            <View style={styles.imageRow}>
              {event.images.map((image, index) => (
                <Image
                  key={index}
                  style={styles.eventImage}
                  source={{ uri: image }}
                  contentFit="cover"
                />
              ))}
            </View>
          )}

          {/* Description - only show if available */}
          {event.description && event.description.trim() !== "" && (
            <Text style={styles.eventDescription} numberOfLines={3}>
              {event.description}
            </Text>
          )}
        </View>
      </Swipeable>
    </View>
  );
};

const EventTags = ({ tags }: { tags: string[] }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => (
        <View key={index} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
};

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      position: "relative",
      overflow: "visible",
    },
    gradientOverlay: {
      position: "absolute",
      top: 112, // Below the calendar preview
      left: 0,
      right: 0,
      height: 60,
      zIndex: 50,
      opacity: 0.8,
    },
    gradientOverlayBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      zIndex: 50,
    },
    timelineLine: {
      position: "absolute",
      left: 48,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.colors.outline,
      zIndex: 0,
    },
    eventList: {
      paddingVertical: 16,
      paddingRight: 16,
      paddingLeft: 26,
      paddingBottom: 80,
      overflow: "visible",
    },
    card: {
      flexDirection: "row",
      marginBottom: 16,
      alignItems: "flex-start",
      position: "relative",
      zIndex: 1,
      backgroundColor: "transparent",
      overflow: "visible",
    },
    dateCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#121111",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.outline,
      marginRight: 16,
      zIndex: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 30,
    },
    dateText: {
      color: "#E6E6E6",
      fontSize: 16,
      fontFamily: "PPNeueMontreal-Medium",
    },
    cardContent: {
      flex: 1,
      backgroundColor: "rgba(17, 16, 16, 0.2)",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      minHeight: 48,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 30,
    },
    // Blur image container - positioned OUTSIDE card, extends beyond borders per Figma
    // Removed overflow:hidden so blur spreads naturally with smooth edges
    blurImageContainer: {
      position: "absolute",
      top: -64,
      left: 24, // After date circle (48px) + margin (16px)
      width: 288,
      height: 288,
      zIndex: 0,
    },
    // MaskedView style for soft blur edges
    maskedView: {
      width: "100%",
      height: "100%",
    },
    // BlurView overlay style
    blurViewOverlay: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
      overflow: "hidden",
    },
    // Blurred background image with 15% opacity per Figma design
    blurImage: {
      width: "100%",
      height: "100%",
      opacity: 0.07,
    },
    // Gradient fades for smooth blur edges
    blurFadeTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60,
    },
    blurFadeBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
    },
    blurFadeLeft: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: 60,
    },
    blurFadeRight: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: 60,
    },
    eventTitle: {
      color: theme.colors.primary,
      fontSize: 16,
      lineHeight: 20.8,
      fontFamily: "PPNeueMontreal-Medium",
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
    },
    tag: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      color: theme.colors.secondary,
      fontSize: 10,
      textTransform: "uppercase",
      fontFamily: "PPNeueMontreal-Medium",
    },
    eventDescription: {
      color: theme.colors.primary,
      fontSize: 14,
      lineHeight: 15.6,
      letterSpacing: 0.12,
      fontFamily: "PPNeueMontreal-Medium",
      marginTop: 8,
    },
    imageRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    eventImage: {
      width: 48,
      height: 48,
      borderRadius: 8,
    },
    monthSeparator: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      marginLeft: 48, // Align with cards
      marginBottom: 16,
    },
    monthText: {
      color: theme.colors.primary,
      fontSize: 20,
      fontWeight: "medium",
      fontFamily: "PPNeueMontreal-Medium",
    },
    calendarContainer: {
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: "#151515",
      zIndex: 100,
      elevation: 100,
      position: "relative",
      borderBottomWidth: 1.5,
      borderBottomColor: "#2B2B2B",
    },
    calendarTitle: {
      color: theme.colors.primary,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 16,
      fontFamily: "PPNeueMontreal-Medium",
    },
    daysRow: {
      paddingHorizontal: 16,
    },
    dayColumn: {
      alignItems: "center",
      justifyContent: "center",
      width: 56,
      height: 80,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: "#1A1D1A",
      borderRadius: 16,
    },
    todayColumn: {
      backgroundColor: "#1B1B1B",
      borderColor: "#B5B5B5",
    },
    dayName: {
      color: "#C1C1C1",
      fontSize: 12,
      marginBottom: 4,
      fontFamily: "PPNeueMontreal-Medium",
    },
    dayNumber: {
      color: "#E6E6E6",
      fontSize: 12,
      fontFamily: "PPNeueMontreal-Medium",
    },
    todayText: {
      color: "#E6E6E6",
    },
    firstOfMonth: {
      marginLeft: 16,
    },
    // Swipeable container
    swipeableContainer: {
      flex: 1,
    },
    // Swipe actions container
    swipeActionsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    // Edit button styles
    editButtonContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingLeft: 8,
    },
    editButton: {
      backgroundColor: "#4A90D9",
      justifyContent: "center",
      alignItems: "center",
      width: 70,
      height: "100%",
      borderRadius: 12,
      flexDirection: "column",
      paddingVertical: 16,
    },
    // Delete button styles
    deleteButtonContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingLeft: 8,
    },
    deleteButton: {
      backgroundColor: "#DC3545",
      justifyContent: "center",
      alignItems: "center",
      width: 70,
      height: "100%",
      borderRadius: 12,
      flexDirection: "column",
      paddingVertical: 16,
    },
    actionButtonText: {
      color: "white",
      fontSize: 12,
      marginTop: 4,
      fontFamily: "PPNeueMontreal-Medium",
    },
    deleteButtonText: {
      color: "white",
      fontSize: 12,
      marginTop: 4,
      fontFamily: "PPNeueMontreal-Medium",
    },
    // Floating Add Event button
    floatingButton: {
      position: "absolute",
      bottom: 56,
      right: 32,
      backgroundColor: "#151515",
      borderRadius: 9999,
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#252525",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 100,
    },
  });

export default TimelineScreen;
