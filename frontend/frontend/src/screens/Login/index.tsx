import React from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Typography } from "../../components/Typography";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { authService, LoginData, loginSchema } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../constants/theme";
import { isAxiosError } from "axios";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data.access_token);
    },
    onError: (error) => {
      let message = "An unexpected error occurred.";
      if (isAxiosError(error) && error.response?.data?.detail) {
        message = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : "Invalid email or password.";
      }
      Alert.alert("Login Failed", message);
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center px-container-padding"
        >
          <View className="mb-stack-lg">
            <Typography variant="headlineLg" className="text-on-surface mb-2">
              Welcome back
            </Typography>
            <Typography variant="bodyMd" className="text-on-surface-variant">
              Log in to access your shared expenses.
            </Typography>
          </View>

          <View className="space-y-4 mb-stack-lg">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          <Button 
            title="Log in" 
            onPress={handleSubmit(onSubmit)} 
            isLoading={loginMutation.isPending}
            className="mb-stack-md"
          />

          <Button 
            title="Don't have an account? Sign up" 
            variant="ghost" 
            onPress={() => navigation.navigate("Register")} 
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
