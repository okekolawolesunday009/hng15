import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductSummary } from "@northstar/shared";
import { colors } from "./theme";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function PageTitle({ eyebrow, title, subtitle }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.titleBlock}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Notice({ message, tone = "neutral", action, onAction }: {
  message: string;
  tone?: "neutral" | "danger" | "success";
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[styles.notice, tone === "danger" && styles.noticeDanger, tone === "success" && styles.noticeSuccess]}>
      <Text style={[styles.noticeText, tone === "danger" && styles.noticeDangerText]}>{message}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.noticeAction}>
          <Text style={styles.noticeActionText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, secondary = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function ProductImage({ uri, style }: {
  uri: string | null;
  style?: object;
}) {
  return uri ? (
    <Image accessibilityLabel="Product photograph" source={{ uri }} style={[styles.productImage, style]} />
  ) : (
    <View style={[styles.imagePlaceholder, style]}>
      <Text style={styles.placeholderMark}>N</Text>
      <Text style={styles.placeholderCaption}>NORTHSTAR GOODS</Text>
    </View>
  );
}

export function ProductCard({ product, onPress }: {
  product: ProductSummary;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
    >
      <ProductImage uri={product.imageUrl} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardCategory}>{product.categoryName ?? "Northstar edit"}</Text>
        <Text numberOfLines={2} style={styles.cardName}>{product.name}</Text>
        <Text style={styles.cardPrice}>{formatCurrency(product.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 7, marginBottom: 22 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  pageTitle: { color: colors.foreground, fontSize: 34, fontWeight: "700", letterSpacing: -1.3 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  notice: {
    alignItems: "center",
    backgroundColor: colors.lavenderSoft,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 14,
  },
  noticeDanger: { backgroundColor: "#FBEAE7" },
  noticeSuccess: { backgroundColor: colors.sage },
  noticeText: { color: colors.foreground, flex: 1, fontSize: 13, lineHeight: 19 },
  noticeDangerText: { color: colors.danger },
  noticeAction: { paddingVertical: 4 },
  noticeActionText: { color: colors.foreground, fontSize: 12, fontWeight: "700" },
  button: {
    alignItems: "center",
    backgroundColor: colors.foreground,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 22,
  },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.78 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.4 },
  secondaryButtonText: { color: colors.foreground },
  productImage: { backgroundColor: colors.surfaceMuted, height: 160, width: "100%" },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: colors.lavenderSoft,
    height: 160,
    justifyContent: "center",
    width: "100%",
  },
  placeholderMark: { color: colors.foreground, fontSize: 42, fontWeight: "700", letterSpacing: -2 },
  placeholderCaption: { color: colors.muted, fontSize: 8, fontWeight: "700", letterSpacing: 2, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 18, overflow: "hidden" },
  pressedCard: { opacity: 0.8 },
  cardImage: { height: 160 },
  cardContent: { gap: 5, padding: 12 },
  cardCategory: { color: colors.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
  cardName: { color: colors.foreground, fontSize: 14, fontWeight: "600", lineHeight: 19, minHeight: 38 },
  cardPrice: { color: colors.foreground, fontSize: 14, fontWeight: "700", marginTop: 2 },
});
