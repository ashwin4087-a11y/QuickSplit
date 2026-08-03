import React, { useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useMembers } from "../../hooks/useMembers";
import {
  useCreateExpense,
  useUpdateExpense,
  useExpense,
} from "../../hooks/useExpenses";
import { isAxiosError } from "axios";
import { useAuth } from "../../contexts/AuthContext";

type NavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "AddExpense" | "EditExpense"
>;
type RouteProps = RouteProp<MainStackParamList, "AddExpense" | "EditExpense">;

const expenseFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Amount must be a positive number"
  ),
  paid_by: z.number({ required_error: "Please select who paid" }),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export const ExpenseFormScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;
  const expenseId = (route.params as { expenseId?: number }).expenseId;
  const isEditMode = !!expenseId;

  const { user } = useAuth();
  const { data: members } = useMembers(groupId);
  const { data: existingExpense } = useExpense(groupId, expenseId ?? 0);

  const createMutation = useCreateExpense(groupId);
  const updateMutation = useUpdateExpense(groupId, expenseId ?? 0);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      paid_by: user?.id,
    },
  });

  // Pre-populate in edit mode
  useEffect(() => {
    if (isEditMode && existingExpense) {
      setValue("title", existingExpense.title);
      setValue("description", existingExpense.description ?? "");
      setValue("amount", existingExpense.amount.toString());
      setValue("paid_by", existingExpense.paid_by);
    }
  }, [isEditMode, existingExpense]);

  const selectedPaidBy = watch("paid_by");

  const onSubmit = (data: ExpenseFormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      amount: parseFloat(data.amount),
      paid_by: data.paid_by,
    };

    if (isEditMode) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigation.goBack(),
        onError: (error) => {
          let msg = "Failed to update expense.";
          if (isAxiosError(error) && error.response?.data?.detail) {
            msg = typeof error.response.data.detail === "string"
              ? error.response.data.detail
              : msg;
          }
          Alert.alert("Error", msg);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (created) => {
          navigation.replace("ExpenseDetails", { groupId, expenseId: created.id });
        },
        onError: (error) => {
          let msg = "Failed to create expense.";
          if (isAxiosError(error) && error.response?.data?.detail) {
            msg = typeof error.response.data.detail === "string"
              ? error.response.data.detail
              : msg;
          }
          Alert.alert("Error", msg);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold ml-2">
          {isEditMode ? "Edit Expense" : "New Expense"}
        </Typography>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="px-container-padding py-stack-md">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Title"
                  placeholder="e.g. Dinner at BBQ Nation"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Amount (₹)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.amount?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Notes (Optional)"
                  placeholder="Any additional notes..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />

            {/* Paid By Selector */}
            <View className="mb-4">
              <Typography variant="labelSm" className="text-on-surface-variant mb-2 ml-1">
                Paid By
              </Typography>
              {errors.paid_by && (
                <Typography variant="labelSm" className="text-error-container mb-1 ml-1">
                  {errors.paid_by.message}
                </Typography>
              )}
              <View className="flex-row flex-wrap gap-2">
                {(members ?? []).map((member: { id: number; full_name: string }) => {
                  const isSelected = selectedPaidBy === member.id;
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => setValue("paid_by", member.id)}
                      className={`px-4 py-2 rounded-xl border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-surface/40 border-outline-variant/30"
                      }`}
                    >
                      <Typography
                        variant="labelMd"
                        className={isSelected ? "text-background font-bold" : "text-on-surface"}
                      >
                        {member.full_name}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button
              title={isEditMode ? "Save Changes" : "Create Expense"}
              onPress={handleSubmit(onSubmit)}
              isLoading={isPending}
              className="mt-4"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
