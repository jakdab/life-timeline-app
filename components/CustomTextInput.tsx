import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { IconButton } from "react-native-paper";

interface CustomTextInputProps extends Omit<RNTextInputProps, "style"> {
  label?: string;
  error?: boolean;
  disabled?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const CustomTextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  (
    {
      label,
      error = false,
      disabled = false,
      rightIcon,
      onRightIconPress,
      containerStyle,
      multiline,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
      if (error) return "#ff5b5f";
      if (isFocused) return "#4D4D56";
      return "#1E1E1E";
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            {
              borderColor: getBorderColor(),
              minHeight: multiline ? 120 : 44,
              alignItems: multiline ? "flex-start" : "center",
            },
          ]}
        >
          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              disabled && styles.disabledInput,
            ]}
            placeholderTextColor="#7D7D8A"
            editable={!disabled}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.iconContainer}
              disabled={disabled}
            >
              <IconButton
                icon={rightIcon}
                iconColor="#7D7D8A"
                size={20}
                style={styles.icon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

CustomTextInput.displayName = "CustomTextInput";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "PPNeueMontreal-Book",
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.28, // 1% of 14px
    color: "#e8e8eb",
    marginBottom: 4,
  },
  inputContainer: {
    backgroundColor: "#121111",
    borderWidth: 1,
    borderRadius: 12,
    // iOS continuous corners approximation
    // React Native doesn't support cornerSmoothing directly,
    // but borderCurve: 'continuous' is available on iOS 13+
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontFamily: "PPNeueMontreal-Book",
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.32, // 1% of 16px
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  multilineInput: {
    paddingTop: 10,
    textAlignVertical: "top",
  },
  disabledInput: {
    opacity: 0.5,
  },
  iconContainer: {
    paddingRight: 4,
  },
  icon: {
    margin: 0,
  },
});

export default CustomTextInput;
