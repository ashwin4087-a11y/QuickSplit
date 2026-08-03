import React, { ReactNode } from "react";
import { View, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { Typography } from "../Typography";

interface ListItemProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  className?: string;
}

export const ListItem = React.memo(({ title, subtitle, left, right, onPress, className = "", ...props }: ListItemProps) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      className={`flex-row items-center gap-4 p-4 rounded-2xl bg-surface/40 border border-white/5 ${onPress ? "active:bg-surface/60 active:scale-[0.99] transition-all" : ""} ${className}`}
      onPress={onPress}
      {...(props as any)}
    >
      {left && <View className="flex-shrink-0">{left}</View>}
      <View className="flex-grow min-w-0">
        <Typography variant="bodyMd" className="font-bold truncate text-on-surface mb-0.5">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="labelMd" className="text-on-surface-variant truncate">
            {subtitle}
          </Typography>
        )}
      </View>
      {right && <View className="flex-shrink-0">{right}</View>}
    </Container>
  );
});
