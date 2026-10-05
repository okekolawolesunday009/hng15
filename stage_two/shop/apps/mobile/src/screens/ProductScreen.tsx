import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ProductSummary } from "@northstar/shared";
import { getProduct } from "../api";
import { Notice, PageTitle, PrimaryButton, ProductImage } from "../components";
import { useCart } from "../cart";
import type { RootStackParamList } from "../types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

export function ProductScreen({ route }: Props) {
  const [product, setProduct] = useState<ProductSummary>(route.params.product);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const { addItem, isLoading, isUpdating } = useCart();

  useEffect(() => {
    let active = true;
    setIsRefreshing(true);
    void getProduct(route.params.product.slug).then((result) => {
      if (active) {
        setProduct(result);
        setDetailError(null);
      }
    }).catch((error: unknown) => {
      if (active) {
        setDetailError(error instanceof Error ? error.message : "Product details couldn't be refreshed.");
      }
    }).finally(() => {
      if (active) setIsRefreshing(false);
    });
    return () => {
      active = false;
    };
  }, [route.params.product.slug]);

  const unavailable = !product.isActive || product.stock < 1;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <ProductImage uri={product.imageUrl} style={styles.image} />
      <View style={styles.details}>
        {detailError ? <Notice message={detailError} /> : null}
        <Text style={styles.category}>{product.categoryName ?? "Northstar edit"}</Text>
        <PageTitle title={product.name} />
        <Text style={styles.price}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price)}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockDot, unavailable && styles.stockDotUnavailable]} />
          <Text style={styles.stockText}>
            {unavailable ? "Currently unavailable" : `${product.stock} available`}
          </Text>
          {isRefreshing ? <ActivityIndicator color={colors.muted} size="small" /> : null}
        </View>
        <PrimaryButton
          disabled={unavailable || isLoading || isUpdating}
          label={unavailable ? "Currently unavailable" : "Add to your bag"}
          onPress={() => void addItem(product)}
        />
        <Text style={styles.shippingNote}>Carefully chosen. Ready for everyday.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingBottom: 35 },
  image: { height: 360 },
  details: { paddingHorizontal: 22, paddingTop: 23 },
  category: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.6, marginBottom: 9, textTransform: "uppercase" },
  price: { color: colors.foreground, fontSize: 20, fontWeight: "700", marginBottom: 17, marginTop: -9 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 20 },
  stockRow: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 19 },
  stockDot: { backgroundColor: colors.success, borderRadius: 4, height: 8, width: 8 },
  stockDotUnavailable: { backgroundColor: colors.danger },
  stockText: { color: colors.muted, flex: 1, fontSize: 12 },
  shippingNote: { color: colors.muted, fontSize: 11, marginTop: 15, textAlign: "center" },
});
