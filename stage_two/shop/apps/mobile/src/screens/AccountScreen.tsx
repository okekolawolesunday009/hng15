import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth";
import { Notice, PageTitle, PrimaryButton } from "../components";
import type { MainTabParamList } from "../types";
import { colors } from "../theme";

type Props = BottomTabScreenProps<MainTabParamList, "Account">;

export function AccountScreen(_props: Props) {
  const {
    user,
    accessToken,
    isLoading,
    isSigningIn,
    isConfigured,
    isReady,
    error,
    signIn,
    signOut,
    clearError,
  } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <PageTitle
        eyebrow="Your Northstar"
        title="Account"
        subtitle="A personal space for your finds."
      />
      <View style={styles.guestCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user?.name?.trim().charAt(0).toUpperCase() || "N"}</Text>
        </View>
        <View style={styles.guestInfo}>
          <Text style={styles.guestTitle}>
            {user?.name ?? (accessToken ? "Account details unavailable" : "Browsing as a guest")}
          </Text>
          <Text style={styles.guestSubtitle}>
            {user?.email ?? (accessToken
              ? "Reconnect to verify your saved sign-in."
              : "Your bag is saved on this device.")}
          </Text>
        </View>
      </View>
      {error ? <Notice action="Dismiss" message={error} onAction={clearError} tone="danger" /> : null}
      {user ? (
        <>
          <Notice message="You're signed in. Your bag is linked with your Northstar account." tone="success" />
          <PrimaryButton
            disabled={isLoading || isSigningIn}
            label="Sign out"
            onPress={() => void signOut()}
            secondary
          />
        </>
      ) : (
        <>
          <Notice
            message="Sign in with Google to link your bag to your account. Your account session is stored securely on this device."
          />
          {!isConfigured ? (
            <Notice message="Google sign-in still needs an Android or iOS OAuth client ID. See apps/mobile/README.md." />
          ) : null}
          <PrimaryButton
            disabled={!isConfigured || !isReady || isLoading || isSigningIn}
            label={isSigningIn ? "Connecting to Google…" : "Continue with Google"}
            onPress={() => void signIn()}
          />
          {isSigningIn ? <ActivityIndicator color={colors.foreground} style={styles.loader} /> : null}
        </>
      )}
      <Text style={styles.footer}>NORTHSTAR · EVERYDAY, CONSIDERED</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: 22, paddingBottom: 38 },
  guestCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 17, flexDirection: "row", gap: 13, marginBottom: 18, padding: 16 },
  avatar: { alignItems: "center", backgroundColor: colors.lavender, borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  avatarLetter: { color: colors.foreground, fontSize: 23, fontWeight: "700" },
  guestInfo: { flex: 1, gap: 4 },
  guestTitle: { color: colors.foreground, fontSize: 14, fontWeight: "700" },
  guestSubtitle: { color: colors.muted, fontSize: 11 },
  loader: { marginTop: 12 },
  footer: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.2, marginTop: 30, textAlign: "center" },
});
