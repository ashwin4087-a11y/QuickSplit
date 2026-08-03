import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Typography } from "../../components/Typography";
import { colors } from "../../constants/theme";

export const SplashScreen = () => {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Typography variant="headlineLg" className="text-primary mb-8 font-extrabold tracking-tight">
        QuickSplit
      </Typography>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};
