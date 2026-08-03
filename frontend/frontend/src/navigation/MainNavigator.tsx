import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/Home";
import { CreateGroupScreen } from "../screens/CreateGroup";
import { GroupDetailsScreen } from "../screens/GroupDetails";
import { MembersListScreen } from "../screens/Members";
import { AddMemberScreen } from "../screens/AddMember";
import { ExpensesListScreen } from "../screens/Expenses";
import { ExpenseDetailsScreen } from "../screens/ExpenseDetails";
import { ExpenseFormScreen } from "../screens/ExpenseForm";
import { ManageSplitsScreen } from "../screens/ManageSplits";
import { BalancesScreen } from "../screens/Balances";
import { RecordSettlementScreen } from "../screens/RecordSettlement";
import { SettlementHistoryScreen } from "../screens/SettlementHistory";

export type MainStackParamList = {
  HomeTabs: undefined;
  CreateGroup: undefined;
  GroupDetails: { groupId: number };
  MembersList: { groupId: number };
  AddMember: { groupId: number };
  ExpensesList: { groupId: number };
  ExpenseDetails: { groupId: number; expenseId: number };
  AddExpense: { groupId: number };
  EditExpense: { groupId: number; expenseId: number };
  ManageSplits: { groupId: number; expenseId: number };
  Balances: { groupId: number };
  RecordSettlement: {
    groupId: number;
    prefillPayerId?: number;
    prefillReceiverId?: number;
    prefillAmount?: string;
  };
  SettlementHistory: { groupId: number };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1220' } }}>
      <Stack.Screen name="HomeTabs" component={HomeScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="MembersList" component={MembersListScreen} />
      <Stack.Screen name="AddMember" component={AddMemberScreen} />
      <Stack.Screen name="ExpensesList" component={ExpensesListScreen} />
      <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
      <Stack.Screen name="AddExpense" component={ExpenseFormScreen} />
      <Stack.Screen name="EditExpense" component={ExpenseFormScreen} />
      <Stack.Screen name="ManageSplits" component={ManageSplitsScreen} />
      <Stack.Screen name="Balances" component={BalancesScreen} />
      <Stack.Screen name="RecordSettlement" component={RecordSettlementScreen} />
      <Stack.Screen name="SettlementHistory" component={SettlementHistoryScreen} />
    </Stack.Navigator>
  );
};
