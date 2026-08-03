import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { useGroup } from "../../hooks/useGroups";
import { EmptyState } from "../../components/EmptyState";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "GroupDetails">;
type RouteProps = RouteProp<MainStackParamList, "GroupDetails">;

export const GroupDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;

  const { data: group, isLoading, isError, refetch } = useGroup(groupId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background p-container-padding">
        <View className="h-32 bg-surface/30 rounded-2xl mb-6" />
      </SafeAreaView>
    );
  }

  if (isError || !group) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState 
          title="Error loading group" 
          description="Could not load group details."
          actionLabel="Retry"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-2 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerClassName="px-container-padding pb-stack-lg pt-stack-md">
        <View className="items-center mb-8">
          <Avatar name={group.name} size="lg" className="mb-4" />
          <Typography variant="headlineLg" className="text-on-surface text-center mb-1">
            {group.name}
          </Typography>
          {group.description && (
            <Typography variant="bodyMd" className="text-on-surface-variant text-center">
              {group.description}
            </Typography>
          )}
        </View>

        <View className="space-y-4">
          <Button 
            title="Members" 
            variant="secondary"
            onPress={() => navigation.navigate("MembersList", { groupId: group.id })}
          />
          <Button 
            title="Expenses" 
            variant="secondary"
            onPress={() => navigation.navigate("ExpensesList", { groupId: group.id })}
          />
          <Button 
            title="Balances" 
            variant="secondary"
            onPress={() => navigation.navigate("Balances", { groupId: group.id })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
