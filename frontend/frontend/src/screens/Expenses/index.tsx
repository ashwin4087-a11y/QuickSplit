import React from "react";
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { useExpenses } from "../../hooks/useExpenses";
import { useMembers } from "../../hooks/useMembers";
import { Expense } from "../../services/expenses";
import { colors } from "../../constants/theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "ExpensesList">;
type RouteProps = RouteProp<MainStackParamList, "ExpensesList">;

export const ExpensesListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;

  const { data: expenses, isLoading, isError, refetch, isRefetching } = useExpenses(groupId);
  const { data: members } = useMembers(groupId);

  const getMemberName = (userId: number): string => {
    const member = members?.find((m: { id: number; full_name: string }) => m.id === userId);
    return member?.full_name ?? `User #${userId}`;
  };

  const formatAmount = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold">Expenses</Typography>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddExpense", { groupId })}
          className="p-2"
        >
          <Typography variant="labelSm" className="text-primary font-bold">+ Add</Typography>
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <View className="px-container-padding flex-1 mt-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="h-24 bg-surface/30 rounded-2xl mb-2" />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          title="Error loading expenses"
          description="Could not load group expenses."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item: Expense) => item.id.toString()}
          contentContainerClassName="px-container-padding pb-32 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No expenses yet"
              description="Add the first expense to this session."
              actionLabel="Add Expense"
              onAction={() => navigation.navigate("AddExpense", { groupId })}
            />
          }
          renderItem={({ item }: { item: Expense }) => (
            <Card
              onPress={() =>
                navigation.navigate("ExpenseDetails", { groupId, expenseId: item.id })
              }
              className="mb-3"
            >
              <View className="flex-row items-start justify-between mb-1">
                <Typography variant="bodyMd" className="font-bold text-on-surface flex-1 mr-2">
                  {item.title}
                </Typography>
                <Typography variant="labelMd" className="text-primary font-bold">
                  {formatAmount(item.amount)}
                </Typography>
              </View>
              <View className="flex-row items-center gap-2">
                <Typography variant="labelSm" className="text-on-surface-variant">
                  Paid by {getMemberName(item.paid_by)}
                </Typography>
              </View>
              {item.description && (
                <Typography
                  variant="labelSm"
                  className="text-on-surface-variant/70 mt-1"
                  numberOfLines={1}
                >
                  {item.description}
                </Typography>
              )}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
};
