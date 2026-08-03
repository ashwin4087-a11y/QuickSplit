import React from "react";
import { TouchableOpacity, ActivityIndicator, TouchableOpacityProps, View } from "react-native";
import { Typography } from "../Typography";
import { colors } from "../../constants/theme";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
  className?: string;
}

export const Button = ({
  title,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses = "flex-row items-center justify-center rounded-xl py-4 px-6 active:opacity-80 transition-opacity";
  
  const variantClasses = {
    primary: "bg-primary shadow-lg shadow-primary/20",
    secondary: "bg-surface",
    outline: "border border-outline-variant bg-transparent",
    ghost: "bg-transparent",
  };

  const textClasses = {
    primary: "text-background font-bold",
    secondary: "text-on-surface font-semibold",
    outline: "text-on-surface font-semibold",
    ghost: "text-primary font-semibold",
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "primary" ? colors.background : colors.primary} />
      ) : (
        <Typography variant="labelMd" className={textClasses[variant]}>
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};
