import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./auth";
import { CartProvider } from "./cart";
import { AppNavigation } from "./navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <AppNavigation />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
