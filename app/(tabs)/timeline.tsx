import React from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";

const events = [
  { id: "1", title: "Graduated High School", date: "2015-06-10" },
  { id: "2", title: "Started First Job", date: "2018-09-01" },
  { id: "3", title: "Got Married", date: "2021-05-20" },
];

const TimelineScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.event}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  event: { marginBottom: 10, padding: 10, borderWidth: 1, borderColor: "#ddd" },
  title: { fontSize: 18, fontWeight: "bold" },
  date: { fontSize: 14, color: "#888" },
});

export default TimelineScreen;
