import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { useCart } from "./cart";
import { AccountScreen } from "./screens/AccountScreen";
import { CartScreen } from "./screens/CartScreen";
import { CatalogScreen } from "./screens/CatalogScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { ProductScreen } from "./screens/ProductScreen";
import type { MainTabParamList, RootStackParamList } from "./types";
import { colors } from "./theme";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { itemCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, focused }) => {
          const symbol = route.name === "Shop" ? "S" : route.name === "Cart" ? "B" : "A";
          return (
            <Text style={{ color, fontSize: focused ? 22 : 20, fontWeight: "700" }}>
              {symbol}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Shop" component={CatalogScreen} options={{ title: "Shop" }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Bag",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.lime, color: colors.foreground, fontSize: 9 },
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: "Account" }} />
    </Tab.Navigator>
  );
}

export function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: "Back",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontSize: 16, fontWeight: "700" },
        }}
      >
        <Stack.Screen component={MainTabs} name="MainTabs" options={{ headerShown: false }} />
        <Stack.Screen component={ProductScreen} name="ProductDetail" options={{ title: "The details" }} />
        <Stack.Screen component={CheckoutScreen} name="Checkout" options={{ title: "Checkout" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
