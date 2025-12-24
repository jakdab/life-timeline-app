import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TimelineHeaderProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onProfilePress?: () => void;
  onFilterPress?: () => void;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  searchValue = "",
  onSearchChange,
  onProfilePress,
  onFilterPress,
}) => {
  const insets = useSafeAreaInsets();
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      Alert.alert("Profile", "Account settings coming soon!");
    }
  };

  const handleFilterPress = () => {
    if (onFilterPress) {
      onFilterPress();
    } else {
      Alert.alert("Filters", "Timeline filters coming soon!");
    }
  };

  const handleSearchChange = (text: string) => {
    setLocalSearchValue(text);
    onSearchChange?.(text);
  };

  const getBorderColor = () => {
    if (isFocused) return "#4D4D56";
    return "#1E1E1E";
  };

  const handleClearSearch = () => {
    setLocalSearchValue("");
    onSearchChange?.("");
  };

  const isSearchActive = localSearchValue.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Profile Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleProfilePress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={24}
          color="#E6E6E6"
        />
      </TouchableOpacity>

      {/* Search Input */}
      <View style={[styles.searchContainer, { borderColor: getBorderColor() }]}>
        {/* Hide search icon when search is active */}
        {!isSearchActive && (
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color="#7D7D8A"
          />
        )}
        <TextInput
          style={styles.searchInput}
          placeholder="Search Event"
          placeholderTextColor="#7D7D8A"
          value={localSearchValue}
          onChangeText={handleSearchChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {/* Show X button when search is active */}
        {isSearchActive && (
          <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color="#E8E8EB"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleFilterPress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="filter-variant"
          size={24}
          color="#E6E6E6"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#151515",
    zIndex: 100,
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "PPNeueMontreal-Book",
    fontSize: 14,
    letterSpacing: 1,
    color: "#FFFFFF",
    padding: 0,
    margin: 0,
    lineHeight: 17,
  },
});

export default TimelineHeader;

