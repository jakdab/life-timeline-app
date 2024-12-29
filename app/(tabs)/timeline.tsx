import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Text, Image } from "react-native";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useTheme, MD3Theme } from "react-native-paper";

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

const TimelineScreen = () => {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Create a query to sort events by date
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

    // Set up real-time listener
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.timelineLine} />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={styles.eventList}
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
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.outline,
      marginRight: 16,
      zIndex: 2,
    },
    dateText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
    cardContent: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      minHeight: 48,
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
  });

export default TimelineScreen;
