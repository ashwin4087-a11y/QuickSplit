import React from "react";
import { View } from "react-native";
import { Typography } from "../Typography";
import { Button } from "../Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({ title, description, actionLabel, onAction, className = "" }: EmptyStateProps) => {
  return (
    <View className={`flex-1 items-center justify-center py-10 px-6 ${className}`}>
      <Typography variant="headlineMd" className="text-center mb-2">
        {title}
      </Typography>
      <Typography variant="bodyMd" className="text-center text-on-surface-variant mb-6">
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
};
