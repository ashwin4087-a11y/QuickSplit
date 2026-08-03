import React from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { useExpense, useDeleteExpense, useExpenseSplits } from "../../hooks/useExpenses";
import { useMembers } from "../../hooks/useMembers";
import { ExpenseSplit } from "../../services/expenses";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "ExpenseDetails">;
type RouteProps = RouteProp<MainStackParamList, "ExpenseDetails">;

export const ExpenseDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId, expenseId } = route.params;

  const { data: expense, isLoading, isError, refetch } = useExpense(groupId, expenseId);
  const { data: splits } = useExpenseSplits(expenseId);
  const { data: members } = useMembers(groupId);
  const deleteExpenseMutation = useDeleteExpense(groupId, expenseId);

  const getMemberName = (userId: number): string => {
    const member = members?.find((m: { id: number; full_name: string }) => m.id === userId);
    return member?.full_name ?? `User #${userId}`;
  };

  const formatAmount = (amount: string) =>
    `₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const handleDelete = () => {
    Alert.alert("Delete Expense", "Are you sure you want to delete this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteExpenseMutation.mutate(undefined, {
            onSuccess: () => navigation.goBack(),
            onError: () => Alert.alert("Error", "Failed to delete expense."),
          });
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background p-6">
        <View className="h-40 bg-surface/30 rounded-2xl mb-4" />
        <View className="h-24 bg-surface/30 rounded-2xl" />
      </SafeAreaView>
    );
  }

  if (isError || !expense) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          title="Error loading expense"
          description="Could not load expense details."
          actionLabel="Retry"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold">Details</Typography>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditExpense", { groupId, expenseId })}
          className="p-2"
        >
          <Typography variant="labelSm" className="text-primary font-bold">Edit</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="px-container-padding pb-stack-lg pt-stack-md">
        {/* Main info */}
        <Card className="mb-4">
          <Typography variant="headlineMd" className="text-on-surface mb-3">
            {expense.title}
          </Typography>
          <View className="flex-row justify-between items-center mb-2">
            <Typography variant="labelMd" className="text-on-surface-variant">Total Amount</Typography>
            <Typography variant="headlineMd" className="text-primary">
              {formatAmount(expense.amount)}
            </Typography>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Typography variant="labelMd" className="text-on-surface-variant">Paid By</Typography>
            <Typography variant="labelMd" className="text-on-surface">
              {getMemberName(expense.paid_by)}
            </Typography>
          </View>
          {expense.description && (
            <View className="mt-2 pt-2 border-t border-outline-variant/30">
              <Typography variant="labelSm" className="text-on-surface-variant mb-1">Notes</Typography>
              <Typography variant="bodyMd" className="text-on-surface">
                {expense.description}
              </Typography>
            </View>
          )}
        </Card>

        {/* Splits */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Typography variant="labelSm" className="text-on-surface-variant uppercase tracking-widest">
              Splits
            </Typography>
            <TouchableOpacity
              onPress={() => navigation.navigate("ManageSplits", { groupId, expenseId })}
            >
              <Typography variant="labelSm" className="text-primary font-bold">Manage</Typography>
            </TouchableOpacity>
          </View>
          {splits && splits.length > 0 ? (
            splits.map((split: ExpenseSplit) => (
              <Card key={split.id} className="mb-2">
                <View className="flex-row justify-between items-center">
                  <Typography variant="labelMd" className="text-on-surface">
                    {getMemberName(split.user_id)}
                  </Typography>
                  <Typography variant="labelMd" className="text-primary font-bold">
                    {formatAmount(split.amount_owed)}
                  </Typography>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <Typography variant="labelMd" className="text-on-surface-variant text-center">
                No splits defined yet.
              </Typography>
            </Card>
          )}
        </View>

        {/* Delete */}
        <Button
          title="Delete Expense"
          variant="outline"
          onPress={handleDelete}
          isLoading={deleteExpenseMutation.isPending}
          className="border-error-container/50"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
