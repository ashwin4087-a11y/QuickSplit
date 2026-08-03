import React from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { GroupData, groupSchema } from "../../services/groups";
import { useCreateGroup } from "../../hooks/useGroups";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "CreateGroup">;

export const CreateGroupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const createGroupMutation = useCreateGroup();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: GroupData) => {
    createGroupMutation.mutate(data, {
      onSuccess: (newGroup) => {
        navigation.replace("GroupDetails", { groupId: newGroup.id });
      },
      onError: () => {
        Alert.alert("Error", "Failed to create group. Please try again.");
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 px-container-padding pt-stack-md"
        >
          <View className="mb-stack-lg">
            <Typography variant="headlineLg" className="text-on-surface mb-2">
              New Session
            </Typography>
            <Typography variant="bodyMd" className="text-on-surface-variant">
              Start a new group to track shared expenses.
            </Typography>
          </View>

          <View className="space-y-4 mb-stack-lg">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Group Name"
                  placeholder="e.g. Weekend Trip"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description (Optional)"
                  placeholder="e.g. Goa trip with friends"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.description?.message}
                />
              )}
            />
          </View>

          <Button 
            title="Create Group" 
            onPress={handleSubmit(onSubmit)} 
            isLoading={createGroupMutation.isPending}
            className="mb-stack-md"
          />
          <Button 
            title="Cancel" 
            variant="ghost" 
            onPress={() => navigation.goBack()} 
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
