import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");


// ============================================================
// 3D INTERACTIVE CARD
// Hover on web + Press on mobile
// ============================================================

function ThreeDCard({ children, style, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        style,
        (hovered || pressed) && styles.threeDHover,
      ]}
    >
      {children}
    </Pressable>
  );
}


// ============================================================
// MAIN SCREEN
// ============================================================

export default function SocialLiftScreen() {

  const router = useRouter();

  // ----------------------------------------------------------
  // Navigate to Register
  // ----------------------------------------------------------

  const goToRegister = () => {
    router.push("/register");
  };


  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ====================================================
            BACKGROUND DECORATIONS
        ==================================================== */}

        <View style={styles.backgroundPurple} />
        <View style={styles.backgroundPink} />
        <View style={styles.backgroundBlue} />


        {/* ====================================================
            NAVBAR
        ==================================================== */}

        <View style={styles.navbar}>

          {/* LOGO */}

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

            <Text style={styles.logoText}>
              Social Lift
            </Text>

          </Pressable>


          {/* NAVIGATION */}

          <View style={styles.navigation}>

            <Pressable
              onPress={() => router.push("/")}
              style={({ hovered }) => [
                styles.navItem,
                styles.activeNav,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.activeNavText}>
                Home
              </Text>
            </Pressable>


            <Pressable
              onPress={() => {
                // YOUR ABOUT URL / SCREEN
              }}
              style={({ hovered }) => [
                styles.navItem,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.navText}>
                About
              </Text>
            </Pressable>


            <Pressable
              onPress={() => {
                // YOUR WORKFLOW URL / SCREEN
              }}
              style={({ hovered }) => [
                styles.navItem,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.navText}>
                Workflow
              </Text>
            </Pressable>


            <Pressable
              onPress={() => {
                // YOUR PRICING URL / SCREEN
              }}
              style={({ hovered }) => [
                styles.navItem,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.navText}>
                Pricing
              </Text>
            </Pressable>


            <Pressable
              onPress={() => {
                // YOUR CONTACT URL / SCREEN
              }}
              style={({ hovered }) => [
                styles.navItem,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.navText}>
                Contact
              </Text>
            </Pressable>

          </View>


          {/* PRIVACY POLICY BUTTON */}

          <Pressable
            onPress={() => router.push("/privacy")}
            style={({ hovered, pressed }) => [
              styles.privacyButton,
              (hovered || pressed) && styles.privacyButtonHover,
            ]}
          >
            <Text style={styles.privacyButtonText}>
              Privacy Policy
            </Text>
          </Pressable>

        </View>



        {/* ====================================================
            HERO
        ==================================================== */}

        <View style={styles.hero}>


          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <View style={styles.heroLeft}>


            {/* BADGE */}

            <ThreeDCard style={styles.badge}>

              <Text style={styles.badgeSparkle}>
                ✦
              </Text>

              <Text style={styles.badgeText}>
                AI-Powered Social Content
              </Text>

            </ThreeDCard>



            {/* MAIN HEADING */}

            <Text style={styles.heading}>

              Create.{" "}

              <Text style={styles.headingDark}>
                Brand.
              </Text>

              {"\n"}

              Post.{" "}

              <Text style={styles.gradientHeading}>
                Effortlessly.
              </Text>

            </Text>



            {/* DESCRIPTION */}

            <Text style={styles.description}>

              Generate engaging, on-brand social media
              content for any platform — in just one prompt.

            </Text>



            {/* FEATURES */}

            <View style={styles.features}>

              <Feature text="Tailored to your brand voice" />

              <Feature text="Optimized for every platform" />

              <Feature text="From prompt to published post" />

            </View>



            {/* BUTTONS */}

            <View style={styles.heroButtons}>


              {/* GENERATE */}

              <Pressable
                onPress={goToRegister}
                style={({ hovered, pressed }) => [
                  styles.primaryButton,
                  (hovered || pressed) &&
                    styles.primaryButtonHover,
                ]}
              >

                <Text style={styles.primaryButtonText}>
                  Generate Your Post
                </Text>

                <Text style={styles.buttonSparkle}>
                  ✦
                </Text>

              </Pressable>



              {/* WORKFLOW */}

              <Pressable
                onPress={() => {
                  // YOUR WORKFLOW URL / SCREEN
                }}
                style={({ hovered, pressed }) => [
                  styles.secondaryButton,
                  (hovered || pressed) &&
                    styles.secondaryButtonHover,
                ]}
              >

                <View style={styles.playCircle}>

                  <Text style={styles.playIcon}>
                    ▶
                  </Text>

                </View>

                <Text style={styles.secondaryButtonText}>
                  See How It Works
                </Text>

              </Pressable>

            </View>

          </View>



          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <View style={styles.heroRight}>


            {/* FLOATING INSTAGRAM */}

            <FloatingCard
              style={styles.instagramFloat}
              text="♥"
            />



            {/* FLOATING LINKEDIN */}

            <FloatingCard
              style={styles.linkedinFloat}
              text="in"
            />



            {/* FLOATING LIKE */}

            <FloatingCard
              style={styles.likeFloat}
              text="👍"
            />



            {/* FLOATING HASHTAG */}

            <FloatingCard
              style={styles.hashFloat}
              text="#"
            />



            {/* PAPER PLANE */}

            <Text style={styles.paperPlane}>
              ➤
            </Text>



            {/* =================================================
                DASHBOARD
            ================================================= */}

            <ThreeDCard
              style={styles.dashboardWrapper}
              onPress={goToRegister}
            >

              <View style={styles.dashboard}>


                {/* BROWSER BAR */}

                <View style={styles.browserBar}>

                  <View style={styles.browserDots}>

                    <View
                      style={[
                        styles.browserDot,
                        { backgroundColor: "#FF6B70" },
                      ]}
                    />

                    <View
                      style={[
                        styles.browserDot,
                        { backgroundColor: "#FFC34D" },
                      ]}
                    />

                    <View
                      style={[
                        styles.browserDot,
                        { backgroundColor: "#4BC47A" },
                      ]}
                    />

                  </View>

                </View>



                {/* DASHBOARD BODY */}

                <View style={styles.dashboardBody}>


                  {/* SIDEBAR */}

                  <View style={styles.sidebar}>

                    <SideIcon icon="⌂" active />

                    <SideIcon icon="✎" />

                    <SideIcon icon="◫" />

                    <SideIcon icon="↗" />

                    <SideIcon icon="⚙" />

                  </View>



                  {/* DASHBOARD MAIN */}

                  <View style={styles.dashboardMain}>

                    <Text style={styles.dashboardTitle}>
                      Generate today's post
                    </Text>



                    {/* PROMPT */}

                    <View style={styles.promptBox}>

                      <Text style={styles.promptText}>
                        Write a post about...
                      </Text>


                      <Pressable
                        onPress={goToRegister}
                        style={({ hovered, pressed }) => [
                          styles.generateButton,
                          (hovered || pressed) &&
                            styles.generateButtonHover,
                        ]}
                      >

                        <Text style={styles.generateButtonText}>
                          Generate
                        </Text>

                        <Text style={styles.generateSparkle}>
                          ✦
                        </Text>

                      </Pressable>

                    </View>



                    {/* PLATFORM CARDS */}

                    <View style={styles.platformGrid}>


                      <PlatformCard
                        icon="◎"
                        name="Instagram"
                        type="instagram"
                      />


                      <PlatformCard
                        icon="in"
                        name="LinkedIn"
                        type="linkedin"
                      />


                      <PlatformCard
                        icon="X"
                        name="X / Twitter"
                        type="x"
                      />

                    </View>

                  </View>

                </View>

              </View>

            </ThreeDCard>

          </View>

        </View>



        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <View style={styles.statsContainer}>


          <StatCard
            icon="👥"
            number="10K+"
            label="Happy Users"
            background="#F0EDFF"
          />


          <StatCard
            icon="▤"
            number="50K+"
            label="Posts Generated"
            background="#E9FAEF"
          />


          <StatCard
            icon="◎"
            number="30+"
            label="Platforms Supported"
            background="#FFF6DC"
          />


          <StatCard
            icon="◷"
            number="99%"
            label="On-time Delivery"
            background="#FFF0F4"
          />

        </View>


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <View style={styles.footer}>

          <View style={styles.footerLinks}>

            <Pressable onPress={() => router.push("/privacy")}>
              <Text style={styles.footerLinkText}>
                Privacy Policy
              </Text>
            </Pressable>

            <Text style={styles.footerDivider}>·</Text>

            <Pressable onPress={() => router.push("/terms")}>
              <Text style={styles.footerLinkText}>
                Terms of Service
              </Text>
            </Pressable>

          </View>

          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} Social Lift. All rights reserved.
          </Text>

        </View>


      </ScrollView>

    </SafeAreaView>
  );
}



// ============================================================
// FEATURE COMPONENT
// ============================================================

function Feature({ text }) {

  return (

    <View style={styles.feature}>

      <View style={styles.checkCircle}>

        <Text style={styles.checkText}>
          ✓
        </Text>

      </View>

      <Text style={styles.featureText}>
        {text}
      </Text>

    </View>

  );
}



// ============================================================
// SIDEBAR ICON
// ============================================================

function SideIcon({ icon, active }) {

  return (

    <Pressable
      style={({ hovered, pressed }) => [
        styles.sideIcon,
        active && styles.activeSideIcon,
        (hovered || pressed) &&
          styles.sideIconHover,
      ]}
    >

      <Text
        style={[
          styles.sideIconText,
          active &&
            styles.activeSideIconText,
        ]}
      >
        {icon}
      </Text>

    </Pressable>

  );
}



// ============================================================
// PLATFORM CARD
// ============================================================

function PlatformCard({
  icon,
  name,
  type,
}) {

  let iconStyle = styles.xIcon;

  if (type === "instagram") {
    iconStyle = styles.instagramIcon;
  }

  if (type === "linkedin") {
    iconStyle = styles.linkedinIcon;
  }


  return (

    <Pressable
      style={({ hovered, pressed }) => [
        styles.platformCard,
        (hovered || pressed) &&
          styles.platformCardHover,
      ]}
    >

      <View
        style={[
          styles.platformIcon,
          iconStyle,
        ]}
      >

        <Text style={styles.platformIconText}>
          {icon}
        </Text>

      </View>


      <View style={styles.platformInfo}>

        <Text style={styles.platformName}>
          {name}
        </Text>

        <Text style={styles.platformStatus}>
          Post ready
        </Text>

      </View>


      <View style={styles.statusCircle}>

        <Text style={styles.statusText}>
          ✓
        </Text>

      </View>

    </Pressable>

  );
}



// ============================================================
// FLOATING CARD
// ============================================================

function FloatingCard({ text, style }) {

  return (

    <Pressable
      style={({ hovered, pressed }) => [
        styles.floatingCard,
        style,
        (hovered || pressed) &&
          styles.floatingCardHover,
      ]}
    >

      <Text style={styles.floatingText}>
        {text}
      </Text>

    </Pressable>

  );
}



// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  number,
  label,
  background,
}) {

  return (

    <Pressable
      style={({ hovered, pressed }) => [
        styles.statCard,
        (hovered || pressed) &&
          styles.statCardHover,
      ]}
    >

      <View
        style={[
          styles.statIcon,
          { backgroundColor: background },
        ]}
      >

        <Text style={styles.statIconText}>
          {icon}
        </Text>

      </View>


      <View>

        <Text style={styles.statNumber}>
          {number}
        </Text>

        <Text style={styles.statLabel}>
          {label}
        </Text>

      </View>

    </Pressable>

  );
}



// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  // ----------------------------------------------------------
  // MAIN
  // ----------------------------------------------------------

  safeArea: {
    flex: 1,
    backgroundColor: "#FAFBFF",
  },

  scrollContent: {
    paddingBottom: 60,
  },


  // ----------------------------------------------------------
  // BACKGROUND
  // ----------------------------------------------------------

  backgroundPurple: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(116, 91, 255, 0.055)",
    top: 120,
    left: -150,
  },

  backgroundPink: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(255, 120, 190, 0.045)",
    top: 430,
    right: -140,
  },

  backgroundBlue: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(80, 160, 255, 0.04)",
    bottom: 100,
    right: 180,
  },


  // ----------------------------------------------------------
  // NAVBAR
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // LOGO
  // ----------------------------------------------------------

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logoHover: {
    transform: [
      { scale: 1.04 },
      { translateY: -2 },
    ],
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


  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  navigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  navItemHover: {
    transform: [
      { scale: 1.05 },
      { translateY: -2 },
    ],
    backgroundColor: "#F7F5FF",
    shadowColor: "#5B4DD0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  activeNav: {
    backgroundColor: "#F2EFFF",
  },

  navText: {
    fontSize: 13,
    color: "#707180",
  },

  activeNavText: {
    fontSize: 13,
    color: "#563DE4",
    fontWeight: "700",
  },


  // ----------------------------------------------------------
  // PRIVACY POLICY BUTTON
  // ----------------------------------------------------------

  privacyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EE",
    backgroundColor: "#FFFFFF",
  },

  privacyButtonHover: {
    backgroundColor: "#F7F5FF",
    borderColor: "#DCD8F7",
  },

  privacyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4DD0",
  },


  // ----------------------------------------------------------
  // START BUTTON
  // ----------------------------------------------------------

  startButton: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#6557ED",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#5749D1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 7,
  },

  startButtonHover: {
    transform: [
      { perspective: 800 },
      { scale: 1.07 },
      { translateY: -4 },
      { rotateX: "2deg" },
    ],
    shadowOffset: { width: 0, height: 17 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 14,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  startArrow: {
    color: "#FFFFFF",
    fontSize: 19,
  },


  // ----------------------------------------------------------
  // HERO
  // ----------------------------------------------------------

  hero: {
    paddingHorizontal: 55,
    paddingTop: 70,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 620,
  },

  heroLeft: {
    flex: 0.9,
    paddingRight: 25,
    zIndex: 5,
  },

  heroRight: {
    flex: 1.1,
    height: 570,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },


  // ----------------------------------------------------------
  // BADGE
  // ----------------------------------------------------------

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E4F3",
    shadowColor: "#4A4373",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },

  badgeSparkle: {
    color: "#604BEA",
    fontSize: 17,
  },

  badgeText: {
    color: "#5745DB",
    fontSize: 13,
    fontWeight: "700",
  },


  // ----------------------------------------------------------
  // 3D GENERAL HOVER
  // ----------------------------------------------------------

  threeDHover: {
    transform: [
      { perspective: 900 },
      { scale: 1.035 },
      { translateY: -5 },
    ],
    shadowColor: "#35305D",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 25,
    elevation: 12,
  },


  // ----------------------------------------------------------
  // HEADING
  // ----------------------------------------------------------

  heading: {
    marginTop: 28,
    fontSize: width > 900 ? 65 : width > 600 ? 55 : 42,
    lineHeight: width > 900 ? 69 : width > 600 ? 59 : 48,
    letterSpacing: -2.5,
    fontWeight: "800",
    color: "#151827",
  },

  headingDark: {
    color: "#202237",
  },

  gradientHeading: {
    color: "#7451E7",
  },


  // ----------------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------------

  description: {
    marginTop: 25,
    maxWidth: 520,
    color: "#686A7B",
    fontSize: 16,
    lineHeight: 26,
  },


  // ----------------------------------------------------------
  // FEATURES
  // ----------------------------------------------------------

  features: {
    marginTop: 28,
    gap: 12,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#6357EA",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#5B50D7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 3,
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  featureText: {
    color: "#606273",
    fontSize: 14,
  },


  // ----------------------------------------------------------
  // HERO BUTTONS
  // ----------------------------------------------------------

  heroButtons: {
    marginTop: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  primaryButton: {
    paddingHorizontal: 23,
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: "#6257EF",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    shadowColor: "#5749D2",
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 7,
  },

  primaryButtonHover: {
    transform: [
      { perspective: 800 },
      { scale: 1.06 },
      { translateY: -5 },
      { rotateX: "2deg" },
    ],
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 14,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  buttonSparkle: {
    color: "#FFFFFF",
    fontSize: 16,
  },

  secondaryButton: {
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EE",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#383653",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  secondaryButtonHover: {
    transform: [
      { perspective: 800 },
      { scale: 1.05 },
      { translateY: -4 },
    ],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 9,
    borderColor: "#DCD8F7",
  },

  playCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#F0EFF9",
    justifyContent: "center",
    alignItems: "center",
  },

  playIcon: {
    color: "#5748D4",
    fontSize: 8,
  },

  secondaryButtonText: {
    color: "#3F4050",
    fontSize: 13,
    fontWeight: "700",
  },


  // ----------------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------------

  dashboardWrapper: {
    width: width > 1000 ? "90%" : "96%",
    borderRadius: 27,
    shadowColor: "#38335E",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
    transform: [
      { perspective: 1000 },
      { rotateY: "-5deg" },
      { rotateX: "3deg" },
      { rotateZ: "-2deg" },
    ],
  },


  dashboard: {
    borderRadius: 27,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEF4",
  },


  browserBar: {
    height: 46,
    backgroundColor: "#FAFAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEF3",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  browserDots: {
    flexDirection: "row",
    gap: 7,
  },

  browserDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },


  dashboardBody: {
    flexDirection: "row",
    minHeight: 365,
  },


  // ----------------------------------------------------------
  // SIDEBAR
  // ----------------------------------------------------------

  sidebar: {
    width: 67,
    backgroundColor: "#20212F",
    paddingVertical: 23,
    alignItems: "center",
    gap: 16,
  },

  sideIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  activeSideIcon: {
    backgroundColor: "#6959EA",
    shadowColor: "#6455DC",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },

  sideIconHover: {
    transform: [
      { scale: 1.12 },
      { translateY: -3 },
    ],
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  sideIconText: {
    color: "#A8A9B8",
    fontSize: 18,
  },

  activeSideIconText: {
    color: "#FFFFFF",
  },


  // ----------------------------------------------------------
  // DASHBOARD MAIN
  // ----------------------------------------------------------

  dashboardMain: {
    flex: 1,
    padding: 28,
    backgroundColor: "#FAFAFD",
  },

  dashboardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#20212D",
    marginBottom: 20,
  },


  // ----------------------------------------------------------
  // PROMPT
  // ----------------------------------------------------------

  promptBox: {
    minHeight: 108,
    padding: 16,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EF",
    justifyContent: "space-between",
    shadowColor: "#343253",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 3,
  },

  promptText: {
    color: "#A0A1AE",
    fontSize: 12,
  },


  // ----------------------------------------------------------
  // GENERATE BUTTON
  // ----------------------------------------------------------

  generateButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#6558EA",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    shadowColor: "#5748D2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 4,
  },

  generateButtonHover: {
    transform: [
      { scale: 1.08 },
      { translateY: -3 },
    ],
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 9,
  },

  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  generateSparkle: {
    color: "#FFFFFF",
    fontSize: 12,
  },


  // ----------------------------------------------------------
  // PLATFORM CARDS
  // ----------------------------------------------------------

  platformGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  platformCard: {
    flex: 1,
    minHeight: 78,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EBEBF2",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#343253",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    transform: [
      { perspective: 800 },
    ],
  },

  platformCardHover: {
    transform: [
      { perspective: 800 },
      { scale: 1.07 },
      { translateY: -6 },
      { rotateX: "3deg" },
      { rotateY: "-3deg" },
    ],
    borderColor: "#DCD8FA",
    shadowColor: "#39345D",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.17,
    shadowRadius: 22,
    elevation: 12,
  },


  platformIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  instagramIcon: {
    backgroundColor: "#E95587",
  },

  linkedinIcon: {
    backgroundColor: "#0878B9",
  },

  xIcon: {
    backgroundColor: "#171820",
  },

  platformIconText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  platformInfo: {
    marginLeft: 9,
    flex: 1,
  },

  platformName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#252631",
  },

  platformStatus: {
    marginTop: 4,
    fontSize: 9,
    color: "#9697A4",
  },

  statusCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#DDF8E8",
    justifyContent: "center",
    alignItems: "center",
  },

  statusText: {
    color: "#29A860",
    fontSize: 9,
    fontWeight: "800",
  },


  // ----------------------------------------------------------
  // FLOATING 3D OBJECTS
  // ----------------------------------------------------------

  floatingCard: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#37325B",
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },

  floatingCardHover: {
    transform: [
      { scale: 1.15 },
      { translateY: -8 },
      { rotate: "5deg" },
    ],
    shadowOffset: { width: 0, height: 23 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 15,
  },

  floatingText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  instagramFloat: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FF7185",
    top: 55,
    left: 25,
    transform: [
      { rotate: "-8deg" },
    ],
  },

  linkedinFloat: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#5791EA",
    bottom: 75,
    left: 0,
  },

  likeFloat: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: "#5E9AF0",
    bottom: 12,
    right: 100,
  },

  hashFloat: {
    width: 63,
    height: 63,
    borderRadius: 19,
    backgroundColor: "#7651E5",
    right: -5,
    bottom: 95,
  },

  paperPlane: {
    position: "absolute",
    right: 30,
    top: 10,
    fontSize: 58,
    color: "#568BF0",
    transform: [
      { rotate: "-25deg" },
    ],
    textShadowColor: "rgba(60,70,160,0.2)",
    textShadowOffset: { width: 7, height: 10 },
    textShadowRadius: 6,
  },


  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------

  statsContainer: {
    paddingHorizontal: 45,
    marginTop: 10,
    flexDirection: "row",
    gap: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 105,
    padding: 17,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E9F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: "#34305A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 3,
    transform: [
      { perspective: 800 },
    ],
  },

  statCardHover: {
    transform: [
      { perspective: 800 },
      { scale: 1.06 },
      { translateY: -7 },
      { rotateX: "3deg" },
      { rotateY: "-2deg" },
    ],
    borderColor: "#DDD9FF",
    shadowColor: "#38345B",
    shadowOffset: { width: 0, height: 19 },
    shadowOpacity: 0.16,
    shadowRadius: 25,
    elevation: 12,
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  statIconText: {
    fontSize: 20,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#20212E",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 10,
    color: "#898A97",
  },


  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footer: {
    marginTop: 50,
    paddingTop: 26,
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

  footerCopyright: {
    fontSize: 12,
    color: "#B3B4C1",
  },
});
