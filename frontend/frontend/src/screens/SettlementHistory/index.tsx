import React from "react";
import { View, FlatList, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useSettlements, useCompleteSettlement } from "../../hooks/useSettlements";
import { Settlement } from "../../services/settlements";
import { colors } from "../../constants/theme";
import { useMembers } from "../../hooks/useMembers";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "SettlementHistory">;
type RouteProps = RouteProp<MainStackParamList, "SettlementHistory">;

const fmt = (amount: string) =>
  `₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const SettlementHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;

  const { data: settlements, isLoading, isError, refetch, isRefetching } = useSettlements(groupId);
  const { data: members } = useMembers(groupId);
  const completeSettlement = useCompleteSettlement(groupId);

  const getMemberName = (userId: number): string => {
    const m = members?.find((m: { id: number; full_name: string }) => m.id === userId);
    return m?.full_name ?? `User #${userId}`;
  };

  const handleComplete = (settlementId: number) => {
    Alert.alert("Mark as Completed", "Mark this payment as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () => {
          completeSettlement.mutate(settlementId, {
            onError: () => Alert.alert("Error", "Failed to complete settlement."),
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold">Payment History</Typography>
        <View className="w-10" />
      </View>

      {isLoading && !isRefetching ? (
        <View className="px-container-padding flex-1 mt-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="h-28 bg-surface/30 rounded-2xl mb-2" />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          title="Error loading history"
          description="Could not load settlement history."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={settlements}
          keyExtractor={(item: Settlement) => item.id.toString()}
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
              title="No payments yet"
              description="Record your first settlement payment."
              actionLabel="Record Payment"
              onAction={() =>
                navigation.navigate("RecordSettlement", { groupId })
              }
            />
          }
          renderItem={({ item }: { item: Settlement }) => (
            <Card className="mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Typography variant="labelMd" className="text-on-surface font-bold mb-1">
                    {getMemberName(item.payer_id)} → {getMemberName(item.receiver_id)}
                  </Typography>
                  <Typography variant="headlineMd" className="text-primary">
                    {fmt(item.amount)}
                  </Typography>
                </View>
                <Badge
                  label={item.status}
                  variant={item.status === "COMPLETED" ? "primary" : "surface"}
                />
              </View>
              <View className="border-t border-outline-variant/20 pt-2 mt-1">
                <Typography variant="labelSm" className="text-on-surface-variant">
                  Created: {fmtDate(item.created_at)}
                </Typography>
                {item.settled_at && (
                  <Typography variant="labelSm" className="text-on-surface-variant">
                    Settled: {fmtDate(item.settled_at)}
                  </Typography>
                )}
              </View>
              {item.status === "PENDING" && (
                <Button
                  title="Mark as Completed"
                  variant="outline"
                  onPress={() => handleComplete(item.id)}
                  isLoading={completeSettlement.isPending}
                  className="mt-3"
                />
              )}
            </Card>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
};
