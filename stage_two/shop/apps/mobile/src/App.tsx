import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "./cart";
import { AppNavigation } from "./navigation";
import { colors } from "./theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <AppNavigation />
      </CartProvider>
    </SafeAreaProvider>
  );
}
