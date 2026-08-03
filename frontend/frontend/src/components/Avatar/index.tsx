import React from "react";
import { View, Image } from "react-native";
import { Typography } from "../Typography";

interface AvatarProps {
  url?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar = React.memo(({ url, name, size = "md", className = "" }: AvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };
  
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <View className={`${sizeClasses[size]} rounded-full overflow-hidden bg-surface border border-outline-variant/30 items-center justify-center ${className}`}>
      {url ? (
        <Image source={{ uri: url }} className="w-full h-full object-cover" />
      ) : (
        <Typography variant="labelMd" className="text-on-surface">
          {initial}
        </Typography>
      )}
    </View>
  );
});
