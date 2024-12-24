import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure the path to your firebase.ts file is correct

// Add interface for Event type
interface Event {
  id: string;
  title: string;
  date: string;
  [key: string]: any; // for any additional fields
}

const TimelineScreen = () => {
  const [events, setEvents] = useState<Event[]>([]); // Add type annotation here

  // Function to fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title as string,
        date: doc.data().date as string,
        ...doc.data(),
      })) as Event[];
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{item.title}</Text>
              <Text variant="bodyMedium">{item.date}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  card: {
    marginBottom: 10,
  },
});

export default TimelineScreen;
