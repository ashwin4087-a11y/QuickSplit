import React from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Badge } from "../../components/Badge";
import { useBalances, useSettlementSuggestions } from "../../hooks/useSettlements";
import { UserBalance, SettlementSuggestion } from "../../services/settlements";
import { colors } from "../../constants/theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "Balances">;
type RouteProps = RouteProp<MainStackParamList, "Balances">;

const fmt = (amount: string) =>
  `₹${Math.abs(parseFloat(amount)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const BalancesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;

  const {
    data: balances,
    isLoading: balancesLoading,
    isError: balancesError,
    refetch: refetchBalances,
    isRefetching: balancesRefetching,
  } = useBalances(groupId);

  const {
    data: suggestions,
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
  } = useSettlementSuggestions(groupId);

  const isRefetching = balancesRefetching;
  const onRefresh = () => {
    refetchBalances();
    refetchSuggestions();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold">Balances</Typography>
        <TouchableOpacity
          onPress={() => navigation.navigate("SettlementHistory", { groupId })}
          className="p-2"
        >
          <Typography variant="labelSm" className="text-primary font-bold">History</Typography>
        </TouchableOpacity>
      </View>

      {balancesLoading && !isRefetching ? (
        <View className="px-container-padding flex-1 mt-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="h-20 bg-surface/30 rounded-2xl mb-2" />
          ))}
        </View>
      ) : balancesError ? (
        <EmptyState
          title="Error loading balances"
          description="Could not load group balances."
          actionLabel="Retry"
          onAction={refetchBalances}
        />
      ) : (
        <ScrollView
          contentContainerClassName="px-container-padding pb-32 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Member Balances */}
          <View className="mb-2 px-1">
            <Typography variant="labelSm" className="text-on-surface-variant uppercase tracking-widest mb-3">
              Who Owes What
            </Typography>
          </View>

          {balances && balances.length > 0 ? (
            balances.map((b: UserBalance) => {
              const netBalance = parseFloat(b.balance);
              const isPositive = netBalance > 0;
              const isNeutral = netBalance === 0;
              return (
                <Card key={b.user_id} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Typography variant="bodyMd" className="font-bold text-on-surface">
                      {b.full_name}
                    </Typography>
                    <Badge
                      label={isNeutral ? "Settled" : isPositive ? "Gets back" : "Owes"}
                      variant={isNeutral ? "surface" : isPositive ? "primary" : "error"}
                    />
                  </View>
                  <View className="flex-row items-center justify-between mt-1">
                    <Typography variant="labelSm" className="text-on-surface-variant">
                      Net
                    </Typography>
                    <Typography
                      variant="labelMd"
                      className={`font-bold ${
                        isNeutral
                          ? "text-on-surface-variant"
                          : isPositive
                          ? "text-primary"
                          : "text-error-container"
                      }`}
                    >
                      {isPositive ? "+" : isNeutral ? "" : "-"}
                      {fmt(b.balance)}
                    </Typography>
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="No balances yet"
              description="Add expenses to see who owes what."
            />
          )}

          {/* Settlement Suggestions */}
          <View className="mt-4 mb-2 px-1">
            <Typography variant="labelSm" className="text-on-surface-variant uppercase tracking-widest mb-3">
              Suggested Transfers
            </Typography>
          </View>

          {suggestionsLoading ? (
            <View className="h-16 bg-surface/30 rounded-2xl" />
          ) : suggestions && suggestions.length > 0 ? (
            suggestions.map((s: SettlementSuggestion, idx: number) => (
              <Card key={idx} className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Typography variant="labelSm" className="text-on-surface-variant mb-0.5">
                      {s.from_user_name} → {s.to_user_name}
                    </Typography>
                    <Typography variant="labelMd" className="text-primary font-bold">
                      {fmt(s.amount)}
                    </Typography>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("RecordSettlement", {
                        groupId,
                        prefillPayerId: s.from_user_id,
                        prefillReceiverId: s.to_user_id,
                        prefillAmount: s.amount,
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-primary/20"
                  >
                    <Typography variant="labelSm" className="text-primary font-bold">
                      Record
                    </Typography>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <Typography variant="labelMd" className="text-on-surface-variant text-center">
                All settled up! 🎉
              </Typography>
            </Card>
          )}
        </ScrollView>
      )}

      {/* FAB — Record new settlement */}
      <View className="absolute bottom-8 right-6">
        <TouchableOpacity
          onPress={() => navigation.navigate("RecordSettlement", { groupId })}
          className="w-16 h-16 rounded-2xl bg-primary items-center justify-center shadow-lg shadow-primary/20"
        >
          <Typography variant="headlineMd" className="text-background font-bold">+</Typography>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
