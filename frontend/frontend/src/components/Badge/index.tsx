import React from "react";
import { View } from "react-native";
import { Typography } from "../Typography";

interface BadgeProps {
  label: string;
  variant?: "primary" | "error" | "surface";
  className?: string;
}

export const Badge = ({ label, variant = "primary", className = "" }: BadgeProps) => {
  const variantClasses = {
    primary: "bg-primary/20",
    error: "bg-error-container/20",
    surface: "bg-surface",
  };
  
  const textColors = {
    primary: "text-primary",
    error: "text-error-container",
    surface: "text-on-surface-variant",
  };

  return (
    <View className={`px-2 py-1 rounded-full items-center justify-center ${variantClasses[variant]} ${className}`}>
      <Typography variant="labelSm" className={textColors[variant]}>
        {label}
      </Typography>
    </View>
  );
};
