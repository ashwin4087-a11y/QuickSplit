import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { AuthNavigator } from "@/navigation/AuthNavigator";
import { MainNavigator } from "@/navigation/MainNavigator";
import { SplashScreen } from "../screens/Splash";

export const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
