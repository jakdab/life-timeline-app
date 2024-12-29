import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useTheme, MD3Theme } from "react-native-paper";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfToday,
  addMonths,
  subMonths,
} from "date-fns";

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
    return <EventCard event={item} />;
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
          { flexGrow: 1, justifyContent: "flex-end" },
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
    </View>
  );
};

const EventCard = ({ event }: { event: Event }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.card}>
      {/* Date Circle */}
      <View style={styles.dateCircle}>
        <Text style={styles.dateText}>{new Date(event.date).getDate()}</Text>
      </View>

      {/* Event Content */}
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <EventTags tags={event.tags || []} />
        <Text style={styles.eventDescription} numberOfLines={3}>
          {event.description || "No description available."}
        </Text>

        {/* Event Images */}
        {event.images && (
          <View style={styles.imageRow}>
            {event.images.map((image, index) => (
              <Image
                key={index}
                style={styles.eventImage}
                source={{ uri: image }}
              />
            ))}
          </View>
        )}
      </View>
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
    },
    card: {
      flexDirection: "row",
      marginBottom: 16,
      alignItems: "flex-start",
      position: "relative",
      zIndex: 1,
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
      color: theme.colors.primary,
      fontSize: 16,
    },
    cardContent: {
      flex: 1,
      backgroundColor: "#121111",
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
      marginBottom: 8,
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
    },
    eventDescription: {
      color: theme.colors.secondary,
      fontSize: 12,
      marginBottom: 8,
    },
    imageRow: {
      flexDirection: "row",
      marginTop: 8,
    },
    eventImage: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 8,
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
      fontWeight: "bold",
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
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 16,
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
    },
    dayNumber: {
      color: "#E6E6E6",
      fontSize: 12,
    },
    todayText: {
      color: "#E6E6E6",
    },
    firstOfMonth: {
      marginLeft: 16,
    },
  });

export default TimelineScreen;
