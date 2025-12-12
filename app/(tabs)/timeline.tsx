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
  Object.keys(groupedEvents).forEach((month) => {
    groupedEvents[month].sort((a, b) => {
      return parseISO(b.date).getTime() - parseISO(a.date).getTime();
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
    return <EventCard event={item} onDelete={handleDeleteEvent} />;
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
}: {
  event: Event;
  onDelete: (id: string) => void;
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

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteButtonContainer}
      >
        <Animated.View
          style={[styles.deleteButton, { opacity, transform: [{ scale }] }]}
        >
          <MaterialCommunityIcons name="trash-can" size={24} color="white" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
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
          <EventTags tags={event.tags || []} />

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

          <Text style={styles.eventDescription} numberOfLines={3}>
            {event.description || "No description available."}
          </Text>
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
    eventTitle: {
      color: theme.colors.primary,
      fontSize: 16,
      lineHeight: 20.8,
      marginBottom: 8,
      fontFamily: "PPNeueMontreal-Medium",
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 8,
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
      fontSize: 12,
      lineHeight: 15.6,
      letterSpacing: 0.12,
      fontFamily: "PPNeueMontreal-Medium",
    },
    imageRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
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
    // Delete button styles
    deleteButtonContainer: {
      justifyContent: "center",
      alignItems: "flex-end",

      paddingLeft: 16,
    },
    deleteButton: {
      backgroundColor: "#DC3545",
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      height: "100%",
      borderRadius: 12,
      flexDirection: "column",
      paddingVertical: 16,
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
