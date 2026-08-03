import React from "react";
import { View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { Typography } from "../../components/Typography";
import { EmptyState } from "../../components/EmptyState";
import { ListItem } from "../../components/ListItem";
import { Avatar } from "../../components/Avatar";
import { useGroups } from "../../hooks/useGroups";
import { colors } from "../../constants/theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "HomeTabs">;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useGroups();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-between items-center px-container-padding py-stack-md">
        <Typography variant="headlineLg" className="text-on-surface">Sessions</Typography>
        <TouchableOpacity onPress={() => navigation.navigate("CreateGroup")} className="p-2">
           <Typography variant="bodyMd" className="text-primary font-bold">+ New</Typography>
        </TouchableOpacity>
      </View>
      
      {isLoading && !isRefetching ? (
         <View className="px-container-padding flex-1 mt-4">
           {[1,2,3].map(i => (
             <View key={i} className="h-20 bg-surface/30 rounded-2xl mb-2" />
           ))}
         </View>
      ) : isError ? (
        <EmptyState 
          title="Error loading groups" 
          description="We couldn't load your sessions right now."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id.toString()}
          contentContainerClassName="px-container-padding pb-32 pt-2"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState 
              title="No active sessions" 
              description="Create a new group to start splitting expenses."
              actionLabel="Create Group"
              onAction={() => navigation.navigate("CreateGroup")}
            />
          }
          renderItem={({ item }) => (
            <ListItem
              className="mb-2"
              title={item.name}
              subtitle={item.description || "No description"}
              left={<Avatar name={item.name} size="lg" />}
              onPress={() => navigation.navigate("GroupDetails", { groupId: item.id })}
            />
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* Custom Bottom Navbar from Stitch design */}
      <View className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 pb-8 pt-4 bg-surface border-t border-white/5 shadow-2xl">
        <TouchableOpacity className="flex-col items-center justify-center gap-1">
          <Typography variant="labelSm" className="text-primary">Inbox</Typography>
        </TouchableOpacity>
        <TouchableOpacity className="flex-col items-center justify-center gap-1 opacity-60">
          <Typography variant="labelSm" className="text-on-surface-variant">Balances</Typography>
        </TouchableOpacity>
        <TouchableOpacity className="flex-col items-center justify-center gap-1 opacity-60">
          <Typography variant="labelSm" className="text-on-surface-variant">Settings</Typography>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
