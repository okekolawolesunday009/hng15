import type { NavigatorScreenParams } from "@react-navigation/native";
import type { ProductSummary } from "@northstar/shared";

export type MainTabParamList = {
  Shop: undefined;
  Cart: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductDetail: { product: ProductSummary };
  Checkout: undefined;
};
