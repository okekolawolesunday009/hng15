import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ProductSummary } from "@northstar/shared";
import { getCategories, getProducts, type Category } from "../api";
import { Notice, PageTitle, ProductCard } from "../components";
import type { MainTabParamList, RootStackParamList } from "../types";
import { colors } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Shop">,
  NativeStackScreenProps<RootStackParamList>
>;

export function CatalogScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestNumber = useRef(0);

  useEffect(() => {
    let active = true;
    void getCategories().then((result) => {
      if (active) {
        setCategories(result);
        setCategoryError(null);
      }
    }).catch(() => {
      if (active) setCategoryError("Categories are unavailable. You can still browse all products.");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const currentRequest = ++requestNumber.current;
    let active = true;
    const timer = setTimeout(() => {
      void getProducts({ category: selectedCategory, search }).then((result) => {
        if (!active || currentRequest !== requestNumber.current) return;
        setProducts(result);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      }).catch((requestError: unknown) => {
        if (!active || currentRequest !== requestNumber.current) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load products. Please try again.",
        );
        setIsLoading(false);
        setIsRefreshing(false);
      });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refreshKey, search, selectedCategory]);

  const header = useMemo(() => (
    <View>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Text style={styles.brandLetter}>N</Text></View>
        <View>
          <Text style={styles.brandName}>northstar</Text>
          <Text style={styles.brandCaption}>EVERYDAY, CONSIDERED</Text>
        </View>
      </View>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>THE NORTHSTAR EDIT</Text>
        <Text style={styles.heroTitle}>A little more{`\n`}room to feel good.</Text>
        <Text style={styles.heroCopy}>Thoughtful finds for a softer, slower everyday.</Text>
        <View style={styles.heroDot} />
      </View>
      <PageTitle eyebrow="Find your next favorite" title="The collection" />
      <TextInput
        accessibilityLabel="Search products"
        onChangeText={setSearch}
        placeholder="Search the collection"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.searchInput}
        value={search}
      />
      {categoryError ? <Notice message={categoryError} /> : null}
      <ScrollView
        contentContainerStyle={styles.categoryList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !selectedCategory }}
          onPress={() => setSelectedCategory(undefined)}
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipSelected]}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextSelected]}>All items</Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === category.slug }}
            key={category.id}
            onPress={() => setSelectedCategory(category.slug)}
            style={[styles.categoryChip, selectedCategory === category.slug && styles.categoryChipSelected]}
          >
            <Text style={[styles.categoryText, selectedCategory === category.slug && styles.categoryTextSelected]}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Made to be kept</Text>
        {!isLoading ? <Text style={styles.resultsCount}>{products.length} FINDS</Text> : null}
      </View>
      {error ? (
        <Notice
          action="Try again"
          message={error}
          onAction={() => {
            setIsLoading(true);
            setRefreshKey((key) => key + 1);
          }}
          tone="danger"
        />
      ) : null}
      {isLoading ? <ActivityIndicator color={colors.foreground} style={styles.loader} /> : null}
      {!isLoading && !error && products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here just yet.</Text>
          <Text style={styles.emptyCopy}>Try another search or browse all items.</Text>
        </View>
      ) : null}
    </View>
  ), [
    categories,
    categoryError,
    error,
    isLoading,
    products.length,
    search,
    selectedCategory,
  ]);

  return (
    <FlatList
      columnWrapperStyle={styles.productRow}
      contentContainerStyle={styles.content}
      data={error ? [] : products}
      keyExtractor={(product) => product.id}
      ListHeaderComponent={header}
      numColumns={2}
      onRefresh={() => {
        setIsRefreshing(true);
        setRefreshKey((key) => key + 1);
      }}
      refreshing={isRefreshing}
      renderItem={({ item }) => (
        <ProductCard
          onPress={() => navigation.navigate("ProductDetail", { product: item })}
          product={item}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { paddingBottom: 26, paddingHorizontal: 18 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 18, marginTop: 10 },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.foreground,
    borderRadius: 24,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  brandLetter: { color: colors.background, fontSize: 22, fontWeight: "700" },
  brandName: { color: colors.foreground, fontSize: 22, fontWeight: "600", letterSpacing: -1 },
  brandCaption: { color: colors.muted, fontSize: 8, fontWeight: "700", letterSpacing: 1.7, marginTop: 1 },
  hero: {
    backgroundColor: colors.lavender,
    borderRadius: 26,
    marginBottom: 28,
    minHeight: 230,
    overflow: "hidden",
    padding: 24,
    position: "relative",
  },
  heroEyebrow: { color: colors.foreground, fontSize: 9, fontWeight: "700", letterSpacing: 1.8 },
  heroTitle: { color: colors.foreground, fontSize: 34, fontWeight: "700", letterSpacing: -1.3, lineHeight: 39, marginTop: 17 },
  heroCopy: { color: colors.foreground, fontSize: 12, lineHeight: 18, marginTop: 11, maxWidth: 225 },
  heroDot: {
    backgroundColor: colors.lime,
    borderColor: "rgba(23,23,23,0.1)",
    borderRadius: 90,
    borderWidth: 1,
    height: 106,
    position: "absolute",
    right: -28,
    top: 145,
    width: 106,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: 14,
    height: 50,
    marginBottom: 13,
    paddingHorizontal: 18,
  },
  categoryList: { gap: 8, paddingBottom: 23 },
  categoryChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 9 },
  categoryChipSelected: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  categoryText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  categoryTextSelected: { color: colors.surface },
  resultsHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  resultsTitle: { color: colors.foreground, fontSize: 19, fontWeight: "700", letterSpacing: -0.4 },
  resultsCount: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  productRow: { gap: 12, marginBottom: 12 },
  loader: { paddingVertical: 35 },
  empty: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, gap: 6, padding: 25 },
  emptyTitle: { color: colors.foreground, fontSize: 16, fontWeight: "700" },
  emptyCopy: { color: colors.muted, fontSize: 12, textAlign: "center" },
});
