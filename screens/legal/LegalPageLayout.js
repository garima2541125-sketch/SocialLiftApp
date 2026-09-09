import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const CONTACT_EMAIL = "garima2541125@gmail.com";

// ============================================================
// SHARED HEADER / FOOTER SHELL FOR LEGAL PAGES
// (Privacy Policy, Terms of Service)
// ============================================================

export default function LegalPageLayout({ title, lastUpdated, children }) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* NAVBAR */}
        <View style={styles.navbar}>
          <Pressable
            onPress={() => router.push("/")}
            style={({ hovered, pressed }) => [
              styles.logoContainer,
              (hovered || pressed) && styles.logoHover,
            ]}
          >
            <View style={styles.logoBox}>
              <LinearGradient
                colors={["#765CFF", "#A55BFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              />
            </View>
            <Text style={styles.logoText}>Social Lift</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/")}
            style={({ hovered, pressed }) => [
              styles.homeLink,
              (hovered || pressed) && styles.homeLinkHover,
            ]}
          >
            <Text style={styles.homeLinkText}>Back to Home</Text>
          </Pressable>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>

          {children}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push("/")}>
              <Text style={styles.footerLinkText}>Home</Text>
            </Pressable>
            <Text style={styles.footerDivider}>·</Text>
            <Pressable onPress={() => router.push("/privacy")}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.footerDivider}>·</Text>
            <Pressable onPress={() => router.push("/terms")}>
              <Text style={styles.footerLinkText}>Terms of Service</Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            Questions? Contact us at {CONTACT_EMAIL}
          </Text>

          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} Social Lift. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// REUSABLE CONTENT BLOCKS
// ============================================================

export function Section({ heading, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {children}
    </View>
  );
}

export function Paragraph({ children }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function BulletList({ items }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View style={styles.bulletRow} key={index}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export { CONTACT_EMAIL };

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFBFF",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // NAVBAR

  navbar: {
    marginHorizontal: 20,
    marginTop: 18,
    minHeight: 72,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#E9E9F1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#302B58",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 25,
    elevation: 5,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logoHover: {
    transform: [{ scale: 1.04 }, { translateY: -2 }],
  },

  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#171824",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#292740",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  logoGradient: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },

  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#151625",
  },

  homeLink: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  homeLinkHover: {
    backgroundColor: "#F7F5FF",
  },

  homeLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4DD0",
  },

  // CONTENT

  content: {
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#151827",
  },

  lastUpdated: {
    marginTop: 8,
    fontSize: 13,
    color: "#8A8B99",
  },

  section: {
    marginTop: 32,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#202237",
    marginBottom: 10,
  },

  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4A4B5A",
    marginBottom: 10,
  },

  bulletList: {
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
  },

  bulletRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 8,
  },

  bulletDot: {
    fontSize: 15,
    lineHeight: 24,
    color: "#7451E7",
  },

  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#4A4B5A",
  },

  // FOOTER

  footer: {
    marginTop: 56,
    paddingTop: 28,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#E9E9F1",
    alignItems: "center",
    gap: 10,
  },

  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  footerLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4DD0",
  },

  footerDivider: {
    fontSize: 13,
    color: "#C7C8D6",
  },

  footerText: {
    fontSize: 12,
    color: "#8A8B99",
  },

  footerCopyright: {
    fontSize: 12,
    color: "#B3B4C1",
  },
});
