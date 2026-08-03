import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { Typography } from "../Typography";
import { colors } from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName = "", className = "", ...props }, ref) => {
    return (
      <View className={`mb-4 ${containerClassName}`}>
        {label && (
          <Typography variant="labelSm" className="text-on-surface-variant mb-2 ml-1">
            {label}
          </Typography>
        )}
        <TextInput
          ref={ref}
          className={`bg-surface/50 border ${
            error ? "border-error-container" : "border-outline-variant/30"
          } rounded-xl px-4 py-4 text-on-surface text-[16px] focus:border-primary focus:bg-surface ${className}`}
          placeholderTextColor={colors.onSurfaceVariant}
          {...props}
        />
        {error && (
          <Typography variant="labelSm" className="text-error-container mt-1 ml-1">
            {error}
          </Typography>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
