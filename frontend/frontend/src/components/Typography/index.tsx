import React from "react";
import { Text, TextProps } from "react-native";
import { typography } from "../../constants/theme";

interface TypographyProps extends TextProps {
  variant?: keyof typeof typography;
  className?: string;
}

export const Typography = ({ variant = "bodyMd", className = "", children, ...props }: TypographyProps) => {
  const baseStyle = typography[variant];
  return (
    <Text className={`${baseStyle} ${className}`} {...props}>
      {children}
    </Text>
  );
};
