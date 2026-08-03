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
import { authService, RegisterData, registerSchema } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";
import { isAxiosError } from "axios";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: async (data, variables) => {
      // Auto-login after successful registration
      try {
        const loginResponse = await authService.login({
          email: variables.email,
          password: variables.password
        });
        login(loginResponse.access_token);
      } catch (e) {
        // Fallback to manual login
        Alert.alert("Success", "Account created! Please log in.");
        navigation.navigate("Login");
      }
    },
    onError: (error) => {
      let message = "An unexpected error occurred.";
      if (isAxiosError(error) && error.response?.data?.detail) {
        message = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : "Registration failed.";
      }
      Alert.alert("Registration Failed", message);
    },
  });

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
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
              Create an account
            </Typography>
            <Typography variant="bodyMd" className="text-on-surface-variant">
              Join QuickSplit to easily manage group expenses.
            </Typography>
          </View>

          <View className="space-y-4 mb-stack-lg">
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Jane Doe"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.full_name?.message}
                />
              )}
            />

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
            title="Sign up" 
            onPress={handleSubmit(onSubmit)} 
            isLoading={registerMutation.isPending}
            className="mb-stack-md"
          />

          <Button 
            title="Already have an account? Log in" 
            variant="ghost" 
            onPress={() => navigation.goBack()} 
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
