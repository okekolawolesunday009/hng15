import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiRequestError, submitCheckout } from "../api";
import { useCart } from "../cart";
import { Notice, PageTitle, PrimaryButton } from "../components";
import type { RootStackParamList } from "../types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;
type FormFields = "name" | "email" | "address" | "city" | "postalCode";
type FormValues = Record<FormFields, string>;

const fields: Array<{ name: FormFields; label: string; placeholder: string; keyboard?: "email-address" }> = [
  { name: "name", label: "Full name", placeholder: "Your name" },
  { name: "email", label: "Email address", placeholder: "you@example.com", keyboard: "email-address" },
  { name: "address", label: "Street address", placeholder: "Address for delivery" },
  { name: "city", label: "City", placeholder: "Your city" },
  { name: "postalCode", label: "Postal code", placeholder: "Postal code" },
];

export function CheckoutScreen({ navigation }: Props) {
  const { lines, itemCount, subtotal } = useCart();
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isPaymentUnavailable, setIsPaymentUnavailable] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);
    setCheckoutMessage(null);
    setIsPaymentUnavailable(false);
    try {
      await submitCheckout({
        ...values,
        items: lines,
      });
      setCheckoutMessage("The shop returned an unexpected checkout response. No order was confirmed and your bag is unchanged.");
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "PAYMENT_UNAVAILABLE") {
        setIsPaymentUnavailable(true);
        setCheckoutMessage("Payment isn't available yet. No order was placed, and your bag has been kept.");
      } else {
        setCheckoutMessage(
          error instanceof Error
            ? `${error.message} Your bag has been kept.`
            : "Checkout couldn't be completed. Your bag has been kept.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <PageTitle
        eyebrow="Almost there"
        title="Delivery details"
        subtitle="Add your details to continue. Payment is not available yet."
      />
      <Notice message="Checkout is not complete until payment processing is enabled. No order will be placed today." />
      <View style={styles.form}>
        {fields.map((field) => (
          <View key={field.name} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              autoCapitalize={field.name === "email" ? "none" : "words"}
              autoComplete={field.name === "name" ? "name" : field.name === "email" ? "email" : "off"}
              keyboardType={field.keyboard ?? "default"}
              onChangeText={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
              placeholder={field.placeholder}
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={values[field.name]}
            />
          </View>
        ))}
      </View>
      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Bag ({itemCount} items)</Text>
          <Text style={styles.summaryValue}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(subtotal)}</Text>
        </View>
        <Text style={styles.summaryNote}>Final totals and availability are verified by the shop.</Text>
      </View>
      {checkoutMessage ? (
        <Notice
          message={checkoutMessage}
          tone={isPaymentUnavailable ? "danger" : "neutral"}
        />
      ) : null}
      <PrimaryButton
        disabled={isSubmitting || lines.length === 0}
        label="Check payment availability"
        onPress={() => void submit()}
      />
      {isSubmitting ? <ActivityIndicator color={colors.foreground} style={styles.loader} /> : null}
      <Text
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.back}
      >Back to your bag</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: 21, paddingBottom: 45 },
  form: { gap: 14, marginBottom: 18 },
  field: { gap: 7 },
  label: { color: colors.foreground, fontSize: 12, fontWeight: "700" },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontSize: 14, minHeight: 50, paddingHorizontal: 14 },
  orderSummary: { backgroundColor: colors.surface, borderRadius: 15, gap: 8, marginBottom: 18, padding: 16 },
  summaryRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: colors.foreground, fontSize: 13, fontWeight: "600" },
  summaryValue: { color: colors.foreground, fontSize: 16, fontWeight: "700" },
  summaryNote: { color: colors.muted, fontSize: 11 },
  loader: { marginTop: 12 },
  back: { color: colors.muted, fontSize: 12, marginTop: 18, padding: 8, textAlign: "center", textDecorationLine: "underline" },
});
