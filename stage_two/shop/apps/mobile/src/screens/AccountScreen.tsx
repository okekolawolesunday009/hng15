import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Notice, PageTitle } from "../components";
import type { MainTabParamList } from "../types";
import { colors } from "../theme";

type Props = BottomTabScreenProps<MainTabParamList, "Account">;

export function AccountScreen(_props: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <PageTitle
        eyebrow="Your Northstar"
        title="Account"
        subtitle="A personal space for your finds."
      />
      <View style={styles.guestCard}>
        <View style={styles.avatar}><Text style={styles.avatarLetter}>N</Text></View>
        <View style={styles.guestInfo}>
          <Text style={styles.guestTitle}>Browsing as a guest</Text>
          <Text style={styles.guestSubtitle}>Your bag is saved on this device.</Text>
        </View>
      </View>
      <Notice message="Native sign-in isn't available yet. Your mobile session and bag are not linked to a customer account." />
      <View style={styles.infoCard}>
        <Text style={styles.infoEyebrow}>COMING LATER</Text>
        <Text style={styles.infoTitle}>Your account, when it's ready.</Text>
        <Text style={styles.infoCopy}>
          Sign-in will arrive after secure native authentication is supported. For now, browse freely and keep your bag on this device.
        </Text>
      </View>
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
  infoCard: { backgroundColor: colors.sage, borderRadius: 19, gap: 10, marginTop: 3, padding: 21 },
  infoEyebrow: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  infoTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700", letterSpacing: -0.5 },
  infoCopy: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  footer: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.2, marginTop: 30, textAlign: "center" },
});
