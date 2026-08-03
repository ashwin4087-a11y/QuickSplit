import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import {
  useExpenseSplits,
  useCreateExpenseSplits,
  useUpdateExpenseSplits,
  useDeleteExpenseSplits,
} from "../../hooks/useExpenses";
import { useMembers } from "../../hooks/useMembers";
import { useExpense } from "../../hooks/useExpenses";
import { ExpenseSplit, ExpenseSplitCreate } from "../../services/expenses";
import { colors } from "../../constants/theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "ManageSplits">;
type RouteProps = RouteProp<MainStackParamList, "ManageSplits">;

export const ManageSplitsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId, expenseId } = route.params;

  const { data: expense } = useExpense(groupId, expenseId);
  const { data: existingSplits, isLoading } = useExpenseSplits(expenseId);
  const { data: members } = useMembers(groupId);

  const createSplits = useCreateExpenseSplits(expenseId);
  const updateSplits = useUpdateExpenseSplits(expenseId);
  const deleteSplits = useDeleteExpenseSplits(expenseId);

  // Local state: map of userId -> amountOwed (string for input)
  const [splitAmounts, setSplitAmounts] = useState<Record<number, string>>({});

  const totalExpense = expense ? parseFloat(expense.amount) : 0;
  const totalSplit = Object.values(splitAmounts).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const remaining = totalExpense - totalSplit;

  const getSplitForMember = (userId: number): string => {
    if (splitAmounts[userId] !== undefined) return splitAmounts[userId];
    const existing = existingSplits?.find((s: ExpenseSplit) => s.user_id === userId);
    return existing ? existing.amount_owed.toString() : "";
  };

  const handleSave = () => {
    const splits: ExpenseSplitCreate[] = Object.entries(splitAmounts)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([userId, amount]) => ({
        user_id: parseInt(userId),
        amount_owed: parseFloat(amount),
      }));

    if (splits.length === 0) {
      Alert.alert("Error", "At least one split amount must be entered.");
      return;
    }

    const hasExisting = existingSplits && existingSplits.length > 0;

    const mutation = hasExisting ? updateSplits : createSplits;
    mutation.mutate(splits, {
      onSuccess: () => {
        Alert.alert("Saved", "Splits updated successfully.");
        navigation.goBack();
      },
      onError: () => Alert.alert("Error", "Failed to save splits."),
    });
  };

  const handleSplitEvenly = () => {
    if (!members || members.length === 0) return;
    const perPerson = (totalExpense / members.length).toFixed(2);
    const newAmounts: Record<number, string> = {};
    members.forEach((m: { id: number }) => { newAmounts[m.id] = perPerson; });
    setSplitAmounts(newAmounts);
  };

  const formatAmount = (v: string) =>
    `₹${parseFloat(v || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const isPending = createSplits.isPending || updateSplits.isPending;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold ml-2">
          Manage Splits
        </Typography>
      </View>

      <ScrollView contentContainerClassName="px-container-padding pb-32 pt-4">
        {/* Total summary */}
        {expense && (
          <Card className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Typography variant="labelMd" className="text-on-surface-variant">Total</Typography>
              <Typography variant="labelMd" className="text-on-surface font-bold">
                ₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Typography>
            </View>
            <View className="flex-row justify-between mb-1">
              <Typography variant="labelMd" className="text-on-surface-variant">Assigned</Typography>
              <Typography variant="labelMd" className="text-primary font-bold">
                ₹{totalSplit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Typography>
            </View>
            <View className="flex-row justify-between">
              <Typography variant="labelMd" className="text-on-surface-variant">Remaining</Typography>
              <Typography
                variant="labelMd"
                className={`font-bold ${remaining < 0 ? "text-error-container" : "text-on-surface"}`}
              >
                ₹{Math.abs(remaining).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                {remaining < 0 ? " over" : ""}
              </Typography>
            </View>
          </Card>
        )}

        <TouchableOpacity
          onPress={handleSplitEvenly}
          className="mb-4 py-3 rounded-xl border border-primary/40 items-center"
        >
          <Typography variant="labelMd" className="text-primary font-bold">
            Split Evenly Among All Members
          </Typography>
        </TouchableOpacity>

        {/* Per-member split inputs */}
        {(members ?? []).map((member: { id: number; full_name: string }) => (
          <Card key={member.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <Typography variant="labelMd" className="text-on-surface font-medium flex-1">
                {member.full_name}
              </Typography>
              <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 border border-outline-variant/30">
                <Typography variant="labelMd" className="text-on-surface-variant mr-1">₹</Typography>
                <TextInput
                  value={getSplitForMember(member.id)}
                  onChangeText={(v) =>
                    setSplitAmounts((prev) => ({ ...prev, [member.id]: v }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="text-on-surface text-[14px] w-24"
                />
              </View>
            </View>
          </Card>
        ))}

        <Button
          title="Save Splits"
          onPress={handleSave}
          isLoading={isPending}
          className="mt-4"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
