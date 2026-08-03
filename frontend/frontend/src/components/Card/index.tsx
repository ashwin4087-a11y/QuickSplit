import React from "react";
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: TouchableOpacityProps["onPress"];
}

export const Card = React.memo(({ children, className = "", onPress, ...props }: CardProps) => {
  const baseStyle = "bg-surface/40 border border-white/5 p-4 rounded-2xl";
  
  if (onPress) {
    return (
      <TouchableOpacity 
        className={`${baseStyle} active:bg-surface/60 active:scale-[0.99] transition-all ${className}`}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseStyle} ${className}`} {...props}>
      {children}
    </View>
  );
});
