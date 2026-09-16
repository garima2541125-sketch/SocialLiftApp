import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

const { width } = Dimensions.get("window");

// Paste the YouTube link to the screen-recording demo here when it's ready.
const HOW_IT_WORKS_VIDEO_URL = "";

const GALLERY_ITEMS = [
  { key: "campus", label: "Campus Grounds", colors: ["#7C6BFF", "#5B4DD0"] },
  { key: "library", label: "Central Library", colors: ["#5E9AF0", "#3E7BD6"] },
  { key: "hostel", label: "Hostel Life", colors: ["#4BC47A", "#2FA05F"] },
  { key: "techfest", label: "Tech Fest", colors: ["#FFB454", "#F08C3C"] },
  { key: "convocation", label: "Convocation Day", colors: ["#FF7185", "#E4536A"] },
  { key: "sports", label: "Sports Complex", colors: ["#7651E5", "#5B3ED0"] },
];

const GALLERY_CARD_WIDTH = 250;
const GALLERY_GAP = 16;

const TEAM_MENTOR = { name: "Dr. Amit Kumar Shrivastava", role: "Project Mentor", initials: "AKS" };

const TEAM_STUDENTS = [
  { name: "Garima Chaudhary", role: "Team Member", initials: "GC" },
  { name: "Divyanshi Dixit", role: "Team Member", initials: "DD" },
  { name: "Maitreyi Gaur", role: "Team Member", initials: "MG" },
];

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

  useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const scrollRef = useRef(null);
  const galleryScrollRef = useRef(null);
  const sectionOffsets = useRef({});

  // ----------------------------------------------------------
  // Section navigation (navbar links + search)
  // ----------------------------------------------------------

  const registerSection = useCallback((key) => (event) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  }, []);

  const scrollToSection = useCallback((key) => {
    const y = sectionOffsets.current[key];
    scrollRef.current?.scrollTo({ y: y != null ? Math.max(y - 20, 0) : 0, animated: true });
  }, []);

  const goToRegister = () => {
    router.push("/register");
  };

  const handleHowItWorks = () => {
    if (HOW_IT_WORKS_VIDEO_URL) {
      Linking.openURL(HOW_IT_WORKS_VIDEO_URL);
    } else {
      Alert.alert("Coming soon", "The demo video walkthrough will be added here shortly.");
    }
  };

  const searchTargets = useMemo(() => [
    { keywords: ["home", "main", "hero"], action: () => scrollToSection("home") },
    { keywords: ["about", "university", "jaypee", "juet", "guna"], action: () => scrollToSection("about") },
    { keywords: ["gallery", "photo", "picture", "video", "campus"], action: () => scrollToSection("gallery") },
    { keywords: ["app", "social lift", "feature", "summary"], action: () => scrollToSection("appSummary") },
    { keywords: ["team", "student", "mentor", "amit", "garima", "divyanshi", "maitreyi"], action: () => scrollToSection("team") },
    { keywords: ["contact", "reach", "support", "email"], action: () => scrollToSection("contact") },
    { keywords: ["privacy"], action: () => router.push("/privacy") },
    { keywords: ["terms"], action: () => router.push("/terms") },
    { keywords: ["login", "sign in"], action: () => router.push("/login") },
    { keywords: ["register", "sign up", "get started"], action: () => router.push("/register") },
  ], [scrollToSection, router]);

  const handleSearchSubmit = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const match = searchTargets.find(({ keywords }) =>
      keywords.some((keyword) => query.includes(keyword))
    );

    if (match) {
      match.action();
    } else {
      Alert.alert("No results", `Nothing matched "${searchQuery}". Try "about", "gallery", "team" or "contact".`);
    }
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      Alert.alert("Almost there", "Please fill in your name, email, and message.");
      return;
    }
    Alert.alert("Thanks for reaching out!", "Our contact form isn't wired up to an inbox yet — we'll be adding that soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  // ----------------------------------------------------------
  // Gallery auto-scroll
  // ----------------------------------------------------------

  useEffect(() => {
    const step = GALLERY_CARD_WIDTH + GALLERY_GAP;
    const id = setInterval(() => {
      setGalleryIndex((prev) => {
        const next = prev + 1 >= GALLERY_ITEMS.length ? 0 : prev + 1;
        galleryScrollRef.current?.scrollTo({
          x: next * step,
          animated: next !== 0,
        });
        return next;
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);


  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        ref={scrollRef}
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

        <View style={styles.navbar} onLayout={registerSection("home")}>

          {/* LOGO */}

          <Pressable
            onPress={() => scrollToSection("home")}
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


          {/* SEARCH BAR */}

          <View style={styles.searchBar}>

            <Text style={styles.searchIcon}>
              🔍
            </Text>

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Search about, gallery, team, contact..."
              placeholderTextColor="#A0A1AE"
              returnKeyType="search"
              style={styles.searchInput}
            />

          </View>


          {/* NAVIGATION */}

          <View style={styles.navigation}>

            <Pressable
              onPress={() => scrollToSection("home")}
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
              onPress={() => scrollToSection("about")}
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
              onPress={() => scrollToSection("gallery")}
              style={({ hovered }) => [
                styles.navItem,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.navText}>
                Gallery
              </Text>
            </Pressable>


            <Pressable
              onPress={() => scrollToSection("team")}
              style={({ hovered }) => [
                styles.navItem,
                hovered && styles.navItemHover,
              ]}
            >
              <Text style={styles.navText}>
                Team
              </Text>
            </Pressable>

          </View>


          {/* TOP ACTION BUTTONS */}

          <View style={styles.navButtons}>

            <Pressable
              onPress={handleHowItWorks}
              style={({ hovered, pressed }) => [
                styles.howItWorksButton,
                (hovered || pressed) && styles.howItWorksButtonHover,
              ]}
            >
              <Text style={styles.playIconSmall}>▶</Text>
              <Text style={styles.howItWorksButtonText}>
                How It Works
              </Text>
            </Pressable>

            <Pressable
              onPress={() => scrollToSection("contact")}
              style={({ hovered, pressed }) => [
                styles.contactButton,
                (hovered || pressed) && styles.contactButtonHover,
              ]}
            >
              <Text style={styles.contactButtonText}>
                Contact Us
              </Text>
            </Pressable>

          </View>

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


              {/* START */}

              <Pressable
                onPress={goToRegister}
                style={({ hovered, pressed }) => [
                  styles.primaryButton,
                  (hovered || pressed) &&
                    styles.primaryButtonHover,
                ]}
              >

                <Text style={styles.primaryButtonText}>
                  Start
                </Text>

                <Text style={styles.buttonSparkle}>
                  ✦
                </Text>

              </Pressable>



              {/* WORKFLOW */}

              <Pressable
                onPress={handleHowItWorks}
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
            ABOUT THE UNIVERSITY
        ==================================================== */}

        <View style={styles.sectionContainer} onLayout={registerSection("about")}>

          <SectionHeading
            eyebrow="ABOUT THE UNIVERSITY"
            title={"Jaypee University of Engineering\nand Technology, Guna"}
          />

          <Text style={styles.sectionParagraph}>
            Jaypee University of Engineering and Technology (JUET) is a UGC-recognized,
            NAAC A+ accredited university on a 122.5-acre campus on A-B Road, Raghogarh,
            Guna, Madhya Pradesh — part of the Jaypee Group's family of educational
            institutes. It offers undergraduate, postgraduate, and doctoral programs across
            Computer Science, Electronics &amp; Communication, Mechanical, Civil, Chemical
            Engineering, and the sciences and humanities, and is recognized as an ISRO
            Nodal Center for the ISRO-START program. With strong industry placements and a
            research-driven faculty, JUET nurtures engineers and innovators who go on to
            build meaningful careers and products — including Social Lift, built by
            students of the university.
          </Text>

          <View style={styles.tagRow}>
            <Tag text="NAAC A+ Accredited" />
            <Tag text="122.5-Acre Campus" />
            <Tag text="Research-Driven Faculty" />
            <Tag text="Strong Industry Placements" />
          </View>

        </View>


        {/* ====================================================
            GALLERY
        ==================================================== */}

        <View style={styles.sectionContainer} onLayout={registerSection("gallery")}>

          <SectionHeading
            eyebrow="CAMPUS GALLERY"
            title="Life at JUET Guna"
            subtitle="A glimpse of the campus and moments behind Social Lift — photos and a screen-recording video will keep rotating here."
          />

          <ScrollView
            ref={galleryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
            contentContainerStyle={styles.galleryContent}
          >

            {GALLERY_ITEMS.map((item) => (
              <ThreeDCard key={item.key} style={styles.galleryCard}>
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.galleryGradient}
                >
                  <Text style={styles.galleryLabel}>{item.label}</Text>
                </LinearGradient>
              </ThreeDCard>
            ))}

          </ScrollView>

          <View style={styles.galleryDots}>
            {GALLERY_ITEMS.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.galleryDot,
                  index === galleryIndex && styles.galleryDotActive,
                ]}
              />
            ))}
          </View>

        </View>


        {/* ====================================================
            APP SUMMARY
        ==================================================== */}

        <View style={styles.sectionContainer} onLayout={registerSection("appSummary")}>

          <SectionHeading
            eyebrow="OUR APP"
            title="What is Social Lift?"
          />

          <Text style={styles.sectionParagraph}>
            Social Lift is an AI-powered social media content studio that helps
            creators and brands go from idea to published post in minutes.
            Describe what you want to share, and Social Lift generates on-brand
            captions, visuals, and platform-ready formatting for Instagram,
            LinkedIn, X, and more — so you can spend less time drafting and more
            time growing your audience.
          </Text>

          <View style={styles.features}>
            <Feature text="AI-generated captions & visuals" />
            <Feature text="Consistent brand voice across posts" />
            <Feature text="One-click multi-platform publishing" />
            <Feature text="Built-in review & approval workflow" />
          </View>

        </View>


        {/* ====================================================
            TEAM
        ==================================================== */}

        <View style={styles.sectionContainer} onLayout={registerSection("team")}>

          <SectionHeading
            eyebrow="OUR TEAM"
            title="Meet the Team"
          />

          <View style={styles.teamTree}>

            <TeamNode {...TEAM_MENTOR} size="large" />

            <View style={styles.treeLineVertical} />
            <View style={styles.treeLineHorizontal} />

            <View style={styles.studentsRow}>
              {TEAM_STUDENTS.map((student) => (
                <View key={student.name} style={styles.studentBranch}>
                  <View style={styles.treeLineStub} />
                  <TeamNode {...student} />
                </View>
              ))}
            </View>

          </View>

        </View>


        {/* ====================================================
            CONTACT
        ==================================================== */}

        <View style={styles.sectionContainer} onLayout={registerSection("contact")}>

          <SectionHeading
            eyebrow="GET IN TOUCH"
            title="Contact Us"
            subtitle="Have a question or feedback about Social Lift? Send us a message and we'll get back to you soon."
          />

          <View style={styles.contactCard}>

            <TextInput
              value={contactForm.name}
              onChangeText={(text) => setContactForm((prev) => ({ ...prev, name: text }))}
              placeholder="Your name"
              placeholderTextColor="#A0A1AE"
              style={styles.contactInput}
            />

            <TextInput
              value={contactForm.email}
              onChangeText={(text) => setContactForm((prev) => ({ ...prev, email: text }))}
              placeholder="Your email"
              placeholderTextColor="#A0A1AE"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.contactInput}
            />

            <TextInput
              value={contactForm.message}
              onChangeText={(text) => setContactForm((prev) => ({ ...prev, message: text }))}
              placeholder="Your message"
              placeholderTextColor="#A0A1AE"
              multiline
              numberOfLines={4}
              style={[styles.contactInput, styles.contactTextarea]}
            />

            <Pressable
              onPress={handleContactSubmit}
              style={({ hovered, pressed }) => [
                styles.primaryButton,
                styles.contactSubmitButton,
                (hovered || pressed) && styles.primaryButtonHover,
              ]}
            >
              <Text style={styles.primaryButtonText}>Send Message</Text>
            </Pressable>

          </View>

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
// SECTION HEADING
// ============================================================

function SectionHeading({ eyebrow, title, subtitle }) {

  return (

    <View style={styles.sectionHeadingBlock}>

      <Text style={styles.sectionEyebrow}>
        {eyebrow}
      </Text>

      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      ) : null}

    </View>

  );
}



// ============================================================
// TAG
// ============================================================

function Tag({ text }) {

  return (

    <View style={styles.tagPill}>
      <Text style={styles.tagText}>{text}</Text>
    </View>

  );
}



// ============================================================
// TEAM NODE
// ============================================================

function TeamNode({ name, role, initials, size }) {

  const circleSize = size === "large" ? 108 : 86;

  return (

    <View style={styles.teamNode}>

      <LinearGradient
        colors={["#765CFF", "#A55BFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.teamAvatar,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
        ]}
      >
        <Text
          style={[
            styles.teamInitials,
            size === "large" && styles.teamInitialsLarge,
          ]}
        >
          {initials}
        </Text>
      </LinearGradient>

      <Text style={styles.teamName}>
        {name}
      </Text>

      <Text style={styles.teamRole}>
        {role}
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
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#E9E9F1",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: 12,
    columnGap: 16,
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
    fontFamily: "Poppins_800ExtraBold",
    color: "#151625",
    letterSpacing: -0.3,
  },


  // ----------------------------------------------------------
  // SEARCH BAR
  // ----------------------------------------------------------

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 180,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 320,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F5F4FB",
    borderWidth: 1,
    borderColor: "#ECEAF7",
  },

  searchIcon: {
    fontSize: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#20212D",
    ...Platform.select({ web: { outlineStyle: "none" } }),
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
    fontFamily: "Poppins_500Medium",
    color: "#707180",
  },

  activeNavText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#563DE4",
  },


  // ----------------------------------------------------------
  // TOP ACTION BUTTONS
  // ----------------------------------------------------------

  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  howItWorksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EE",
    backgroundColor: "#FFFFFF",
  },

  howItWorksButtonHover: {
    backgroundColor: "#F7F5FF",
    borderColor: "#DCD8F7",
  },

  playIconSmall: {
    fontSize: 9,
    color: "#5748D4",
  },

  howItWorksButtonText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#3F4050",
  },

  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#6557ED",
    shadowColor: "#5749D1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  contactButtonHover: {
    transform: [
      { scale: 1.05 },
      { translateY: -2 },
    ],
    shadowOpacity: 0.32,
  },

  contactButtonText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
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
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.2,
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
    fontFamily: "Poppins_800ExtraBold",
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
    fontFamily: "Poppins_400Regular",
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
    fontFamily: "Poppins_700Bold",
  },

  featureText: {
    color: "#606273",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
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
    justifyContent: "center",
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
    fontFamily: "Poppins_700Bold",
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
    fontFamily: "Poppins_700Bold",
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
    fontFamily: "Poppins_800ExtraBold",
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
    fontFamily: "Poppins_400Regular",
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
    fontFamily: "Poppins_700Bold",
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
    fontFamily: "Poppins_800ExtraBold",
  },

  platformInfo: {
    marginLeft: 9,
    flex: 1,
  },

  platformName: {
    fontSize: 10,
    fontFamily: "Poppins_800ExtraBold",
    color: "#252631",
  },

  platformStatus: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
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
    fontFamily: "Poppins_800ExtraBold",
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
    fontFamily: "Poppins_800ExtraBold",
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
    fontFamily: "Poppins_800ExtraBold",
    color: "#20212E",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    color: "#898A97",
  },


  // ----------------------------------------------------------
  // GENERIC SECTION
  // ----------------------------------------------------------

  sectionContainer: {
    marginTop: 70,
    paddingHorizontal: 45,
  },

  sectionHeadingBlock: {
    alignItems: "center",
    marginBottom: 30,
  },

  sectionEyebrow: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: "#6557ED",
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: width > 900 ? 34 : width > 600 ? 28 : 24,
    lineHeight: width > 900 ? 42 : width > 600 ? 36 : 30,
    fontFamily: "Poppins_800ExtraBold",
    color: "#151827",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    marginTop: 14,
    maxWidth: 560,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Poppins_400Regular",
    color: "#686A7B",
    textAlign: "center",
  },

  sectionParagraph: {
    maxWidth: 780,
    alignSelf: "center",
    fontSize: 15,
    lineHeight: 26,
    fontFamily: "Poppins_400Regular",
    color: "#54566A",
    textAlign: "center",
  },


  // ----------------------------------------------------------
  // TAGS
  // ----------------------------------------------------------

  tagRow: {
    marginTop: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },

  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F2EFFF",
    borderWidth: 1,
    borderColor: "#E1DCFA",
  },

  tagText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#5B4DD0",
  },


  // ----------------------------------------------------------
  // GALLERY
  // ----------------------------------------------------------

  galleryScroll: {
    marginTop: 10,
  },

  galleryContent: {
    gap: GALLERY_GAP,
    paddingHorizontal: 4,
  },

  galleryCard: {
    width: GALLERY_CARD_WIDTH,
    height: 170,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#38335E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },

  galleryGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },

  galleryLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  galleryDots: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },

  galleryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DDD9F0",
  },

  galleryDotActive: {
    backgroundColor: "#6557ED",
    width: 18,
  },


  // ----------------------------------------------------------
  // TEAM
  // ----------------------------------------------------------

  teamTree: {
    alignItems: "center",
    marginTop: 10,
  },

  treeLineVertical: {
    width: 2,
    height: 30,
    backgroundColor: "#D8D4F5",
  },

  treeLineHorizontal: {
    width: "58%",
    maxWidth: 460,
    minWidth: 220,
    height: 2,
    backgroundColor: "#D8D4F5",
  },

  studentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "80%",
    maxWidth: 620,
    gap: 20,
  },

  studentBranch: {
    alignItems: "center",
    flex: 1,
    minWidth: 140,
  },

  treeLineStub: {
    width: 2,
    height: 22,
    backgroundColor: "#D8D4F5",
  },

  teamNode: {
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  teamAvatar: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A4373",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },

  teamInitials: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },

  teamInitialsLarge: {
    fontSize: 28,
  },

  teamName: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "#20212D",
    textAlign: "center",
  },

  teamRole: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#8B8C9A",
  },


  // ----------------------------------------------------------
  // CONTACT
  // ----------------------------------------------------------

  contactCard: {
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
    padding: 26,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E9F1",
    gap: 14,
    shadowColor: "#302B58",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },

  contactInput: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#FAFAFD",
    borderWidth: 1,
    borderColor: "#E5E5EF",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#20212D",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },

  contactTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  contactSubmitButton: {
    marginTop: 4,
    alignSelf: "stretch",
    justifyContent: "center",
  },


  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footer: {
    marginTop: 70,
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
    fontFamily: "Poppins_700Bold",
    color: "#5B4DD0",
  },

  footerDivider: {
    fontSize: 13,
    color: "#C7C8D6",
  },

  footerCopyright: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#B3B4C1",
  },
});
