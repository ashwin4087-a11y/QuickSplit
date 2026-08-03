import React from "react";
import { View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { EmptyState } from "../../components/EmptyState";
import { ListItem } from "../../components/ListItem";
import { Avatar } from "../../components/Avatar";
import { useMembers } from "../../hooks/useMembers";
import { colors } from "../../constants/theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "MembersList">;
type RouteProps = RouteProp<MainStackParamList, "MembersList">;

export const MembersListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;

  const { data: members, isLoading, isError, refetch, isRefetching } = useMembers(groupId);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold">Members</Typography>
        <TouchableOpacity onPress={() => navigation.navigate("AddMember", { groupId })} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">+ Add</Typography>
        </TouchableOpacity>
      </View>
      
      {isLoading && !isRefetching ? (
         <View className="px-container-padding flex-1 mt-4">
           {[1,2,3].map(i => (
             <View key={i} className="h-16 bg-surface/30 rounded-2xl mb-2" />
           ))}
         </View>
      ) : isError ? (
        <EmptyState 
          title="Error loading members" 
          description="Could not load group members."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerClassName="px-container-padding pb-stack-lg pt-4"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState 
              title="No members yet" 
              description="Add someone to this session."
              actionLabel="Add Member"
              onAction={() => navigation.navigate("AddMember", { groupId })}
            />
          }
          renderItem={({ item }: { item: any }) => (
            <ListItem
              className="mb-2"
              title={item.full_name}
              subtitle={item.email}
              left={<Avatar name={item.full_name} size="md" />}
            />
          )}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
};
