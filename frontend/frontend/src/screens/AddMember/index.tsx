import React from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAddMember } from "../../hooks/useMembers";
import { isAxiosError } from "axios";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "AddMember">;
type RouteProps = RouteProp<MainStackParamList, "AddMember">;

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});
type AddMemberData = z.infer<typeof addMemberSchema>;

export const AddMemberScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;
  const addMemberMutation = useAddMember(groupId);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMemberData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: AddMemberData) => {
    addMemberMutation.mutate(data.email, {
      onSuccess: () => {
        Alert.alert("Success", "Member added successfully.");
        navigation.goBack();
      },
      onError: (error) => {
        let message = "Failed to add member.";
        if (isAxiosError(error) && error.response?.data?.detail) {
          message = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : "Invalid user or member already exists.";
        }
        Alert.alert("Error", message);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-2 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 px-container-padding pt-stack-md"
        >
          <View className="mb-stack-lg">
            <Typography variant="headlineLg" className="text-on-surface mb-2">
              Add Member
            </Typography>
            <Typography variant="bodyMd" className="text-on-surface-variant">
              Enter the email address of the user you want to add to this session.
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
          </View>

          <Button 
            title="Add Member" 
            onPress={handleSubmit(onSubmit)} 
            isLoading={addMemberMutation.isPending}
            className="mb-stack-md"
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
