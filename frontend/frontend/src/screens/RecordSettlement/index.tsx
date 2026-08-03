import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
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
import { useCreateSettlement } from "../../hooks/useSettlements";
import { useMembers } from "../../hooks/useMembers";
import { isAxiosError } from "axios";
import { colors } from "../../constants/theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "RecordSettlement">;
type RouteProps = RouteProp<MainStackParamList, "RecordSettlement">;

export const RecordSettlementScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId, prefillPayerId, prefillReceiverId, prefillAmount } = route.params;

  const { data: members } = useMembers(groupId);
  const createSettlement = useCreateSettlement(groupId);

  const [payerId, setPayerId] = useState<number | null>(prefillPayerId ?? null);
  const [receiverId, setReceiverId] = useState<number | null>(prefillReceiverId ?? null);
  const [amount, setAmount] = useState<string>(prefillAmount ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!payerId) errs.payer = "Select who paid";
    if (!receiverId) errs.receiver = "Select who receives";
    if (payerId === receiverId) errs.receiver = "Payer and receiver must be different";
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;
    createSettlement.mutate(
      { payer_id: payerId!, receiver_id: receiverId!, amount: parseFloat(amount) },
      {
        onSuccess: () => {
          Alert.alert("Success", "Settlement recorded.");
          navigation.goBack();
        },
        onError: (error) => {
          let msg = "Failed to record settlement.";
          if (isAxiosError(error) && error.response?.data?.detail) {
            msg = typeof error.response.data.detail === "string"
              ? error.response.data.detail : msg;
          }
          Alert.alert("Error", msg);
        },
      }
    );
  };

  const MemberSelector = ({
    label,
    selected,
    onSelect,
    error,
    excludeId,
  }: {
    label: string;
    selected: number | null;
    onSelect: (id: number) => void;
    error?: string;
    excludeId?: number | null;
  }) => (
    <View className="mb-4">
      <Typography variant="labelSm" className="text-on-surface-variant mb-2 ml-1">
        {label}
      </Typography>
      {error && (
        <Typography variant="labelSm" className="text-error-container mb-1 ml-1">
          {error}
        </Typography>
      )}
      <View className="flex-row flex-wrap gap-2">
        {(members ?? [])
          .filter((m: { id: number }) => m.id !== excludeId)
          .map((member: { id: number; full_name: string }) => {
            const isSelected = selected === member.id;
            return (
              <TouchableOpacity
                key={member.id}
                onPress={() => onSelect(member.id)}
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
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Typography variant="labelSm" className="text-primary font-bold">← Back</Typography>
        </TouchableOpacity>
        <Typography variant="labelMd" className="text-on-surface font-bold ml-2">
          Record Payment
        </Typography>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="px-container-padding py-stack-md">
            <MemberSelector
              label="Who Paid"
              selected={payerId}
              onSelect={setPayerId}
              error={errors.payer}
              excludeId={receiverId}
            />

            <MemberSelector
              label="Paid To"
              selected={receiverId}
              onSelect={setReceiverId}
              error={errors.receiver}
              excludeId={payerId}
            />

            {/* Amount input */}
            <View className="mb-6">
              <Typography variant="labelSm" className="text-on-surface-variant mb-2 ml-1">
                Amount (₹)
              </Typography>
              {errors.amount && (
                <Typography variant="labelSm" className="text-error-container mb-1 ml-1">
                  {errors.amount}
                </Typography>
              )}
              <View className="flex-row items-center bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-4">
                <Typography variant="bodyMd" className="text-on-surface-variant mr-2">₹</Typography>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="flex-1 text-on-surface text-[16px]"
                />
              </View>
            </View>

            <Button
              title="Record Payment"
              onPress={onSubmit}
              isLoading={createSettlement.isPending}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
