import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCart } from "../cart";
import { Notice, PageTitle, PrimaryButton, ProductImage, formatCurrency } from "../components";
import type { MainTabParamList, RootStackParamList } from "../types";
import { colors } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Cart">,
  NativeStackScreenProps<RootStackParamList>
>;

export function CartScreen({ navigation }: Props) {
  const {
    lines,
    items,
    itemCount,
    subtotal,
    error,
    isLoading,
    isUpdating,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    getCachedProduct,
  } = useCart();
  const rows = lines.map((line) => ({
    line,
    remote: items.find((item) => item.id === line.productId),
    cached: getCachedProduct(line.productId),
  }));

  const confirmClear = () => {
    Alert.alert("Clear your bag?", "This will remove all saved items from your bag.", [
      { text: "Keep items", style: "cancel" },
      { text: "Clear bag", style: "destructive", onPress: () => void clearCart() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <PageTitle
        eyebrow="Your northstar finds"
        title="Your bag"
        subtitle={`${itemCount} ${itemCount === 1 ? "item" : "items"} saved for later.`}
      />
      {error ? <Notice action="Retry sync" message={error} onAction={() => void refreshCart()} tone="danger" /> : null}
      {isLoading ? <Notice message="Restoring your saved bag…" /> : null}
      {rows.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyMark}>N</Text>
          <Text style={styles.emptyTitle}>A little room for something good.</Text>
          <Text style={styles.emptyCopy}>Your bag is waiting for a favorite.</Text>
          <PrimaryButton label="Explore the collection" onPress={() => navigation.navigate("Shop")} />
        </View>
      ) : null}
      {rows.map(({ line, remote, cached }) => {
        const name = remote?.name ?? cached?.name ?? "Saved product";
        const image = remote?.imageUrl ?? cached?.imageUrl ?? null;
        const price = remote?.price ?? cached?.price;
        const stock = remote?.stock ?? cached?.stock;
        return (
          <View key={line.productId} style={styles.item}>
            <ProductImage uri={image} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text numberOfLines={2} style={styles.itemName}>{name}</Text>
              {typeof price === "number" ? <Text style={styles.itemPrice}>{formatCurrency(price)}</Text> : null}
              {!remote && !cached ? <Text style={styles.itemOffline}>Product details will appear when you reconnect.</Text> : null}
              {typeof stock === "number" && line.quantity > stock ? (
                <Text style={styles.itemOffline}>Only {stock} currently available.</Text>
              ) : null}
              <View style={styles.quantityRow}>
                <View style={styles.quantityControl}>
                  <Pressable
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isUpdating }}
                    disabled={isUpdating}
                    onPress={() => void updateQuantity(line.productId, line.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.quantityValue}>{line.quantity}</Text>
                  <Pressable
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isUpdating || (typeof stock === "number" && line.quantity >= stock) }}
                    disabled={isUpdating || (typeof stock === "number" && line.quantity >= stock)}
                    onPress={() => void updateQuantity(line.productId, line.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={isUpdating}
                  onPress={() => void removeItem(line.productId)}
                  style={styles.removeButton}
                >
                  <Text
                    style={styles.removeText}
                  >Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
      {rows.length > 0 ? (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <Text style={styles.summaryNote}>Shipping and availability are confirmed at checkout.</Text>
          <PrimaryButton
            disabled={isUpdating || isLoading || rows.some(({ remote, cached }) => !remote && !cached)}
            label="Continue to checkout"
            onPress={() => navigation.navigate("Checkout")}
          />
          <PrimaryButton
            disabled={isUpdating}
            label="Clear bag"
            onPress={confirmClear}
            secondary
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: 21, paddingBottom: 40 },
  empty: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 22, gap: 12, padding: 25 },
  emptyMark: { alignItems: "center", backgroundColor: colors.lavender, borderRadius: 36, color: colors.foreground, fontSize: 28, fontWeight: "700", lineHeight: 58, overflow: "hidden", textAlign: "center", width: 58 },
  emptyTitle: { color: colors.foreground, fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyCopy: { color: colors.muted, fontSize: 13, marginBottom: 7 },
  item: { backgroundColor: colors.surface, borderRadius: 18, flexDirection: "row", gap: 14, marginBottom: 12, overflow: "hidden", padding: 10 },
  itemImage: { borderRadius: 12, height: 112, width: 96 },
  itemInfo: { flex: 1, justifyContent: "center", paddingVertical: 3 },
  itemName: { color: colors.foreground, fontSize: 14, fontWeight: "700", lineHeight: 19 },
  itemPrice: { color: colors.muted, fontSize: 12, marginTop: 5 },
  itemOffline: { color: colors.danger, fontSize: 10, lineHeight: 14, marginTop: 4 },
  quantityRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  quantityControl: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: 999, flexDirection: "row", gap: 12, paddingHorizontal: 10, paddingVertical: 4 },
  quantityButton: { alignItems: "center", justifyContent: "center", minHeight: 34, minWidth: 26 },
  quantityButtonText: { color: colors.foreground, fontSize: 18, textAlign: "center" },
  quantityValue: { color: colors.foreground, fontSize: 12, fontWeight: "700" },
  removeButton: { padding: 5 },
  removeText: { color: colors.muted, fontSize: 10, textDecorationLine: "underline" },
  summary: { backgroundColor: colors.surface, borderRadius: 18, gap: 13, marginTop: 9, padding: 18 },
  summaryRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: colors.foreground, fontSize: 15, fontWeight: "600" },
  summaryValue: { color: colors.foreground, fontSize: 18, fontWeight: "700" },
  summaryNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 2 },
});
