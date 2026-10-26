import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

// "Congratulations on your placement" poster, laid out on a fixed 642×847
// canvas (the size of the T&P Cell reference poster it copies) with every
// element positioned in those canvas pixels. Everything printed on it —
// names, numbers, logos, the photo — comes straight from the user's own
// input or Brand Kit; nothing here is AI-drawn, so it can't be misspelt or
// turn the student into someone else.

export const POSTER_WIDTH = 642;
export const POSTER_HEIGHT = 847;

const NAVY = '#232C6E';
const LOCATION_RED = '#D32F3A';
const HEADING_PURPLE = '#5A2A82';
const SCRIPT_BLUE = '#174A9E';
const INK = '#15163A';
const RING = '#8C7FD3';

// Reproduces a left-to-right gradient fill on text by colouring each
// character — works the same on web and native without masking libraries.
function GradientText({ text, from, to, style }) {
  const chars = Array.from(text);
  const steps = Math.max(chars.length - 1, 1);
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [r1, g1, b1] = hex(from);
  const [r2, g2, b2] = hex(to);

  return (
    <Text style={style}>
      {chars.map((ch, i) => {
        const t = i / steps;
        return (
          <Text key={i} style={{ color: `rgb(${mix(r1, r2, t)}, ${mix(g1, g2, t)}, ${mix(b1, b2, t)})` }}>
            {ch}
          </Text>
        );
      })}
    </Text>
  );
}

function GlobeIcon() {
  return (
    <View style={styles.globe}>
      <View style={styles.globeMeridian} />
      <View style={styles.globeEquator} />
    </View>
  );
}

function batchLine({ branch, batch }) {
  if (branch && batch) return `${branch} - ${batch} Batch`;
  if (batch) return `${batch} Batch`;
  return branch || '';
}

// Shrinks long names to fit the pill instead of cutting them off
// (adjustsFontSizeToFit doesn't work on web). ~0.74em per bold capital.
const NAME_PILL_TEXT_WIDTH = 242;

function nameSize(name) {
  const fontSize = Math.max(13, Math.min(22, NAME_PILL_TEXT_WIDTH / (name.length * 0.74)));
  return { fontSize, lineHeight: Math.round(fontSize * 1.25) };
}

const PlacementPoster = forwardRef(function PlacementPoster(
  { fields: details, images, brandKit },
  ref
) {
  const studentPhotoUri = images.studentPhoto;
  const companyLogoUri = images.companyLogo;

  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
    DancingScript_700Bold,
    Cinzel_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const showLogo = brandKit.logoMode === 'upload' ? !!brandKit.logoUri : !!brandKit.brandText;
  const company = details.company || 'Company name';
  const batchText = batchLine(details);
  const studentName = (details.studentName || 'Student name').toUpperCase();

  if (!fontsLoaded) {
    return <View ref={ref} style={[styles.canvas, styles.loading]} />;
  }

  return (
    <View ref={ref} style={styles.canvas} collapsable={false}>
      {/* ================= HEADER ================= */}
      <LinearGradient
        colors={['#DCEBF3', '#EEF6FA', '#F7FBFD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      />

      {showLogo &&
        (brandKit.logoMode === 'upload' ? (
          <Image source={{ uri: brandKit.logoUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.logo}>
            <Text style={styles.wordmark} numberOfLines={2}>
              {brandKit.brandText}
            </Text>
          </View>
        ))}

      <View style={[styles.orgBlock, !showLogo && styles.orgBlockNoLogo]}>
        {!!brandKit.orgName && <Text style={styles.orgName}>{brandKit.orgName.toUpperCase()}</Text>}
        {!!brandKit.orgLocation && (
          <Text style={styles.orgLocation}>{brandKit.orgLocation.toUpperCase()}</Text>
        )}
      </View>

      {!!brandKit.badgesUri && (
        <Image source={{ uri: brandKit.badgesUri }} style={styles.badges} resizeMode="contain" />
      )}

      {/* ================= HEADLINE ================= */}
      <Text style={styles.congrats}>Congratulations</Text>
      <Text style={styles.subline}>
        For your incredible <Text style={styles.sublineAccent}>Placement offer and</Text>
        {'\nbright future ahead'}
      </Text>

      {/* ================= BOTTOM WAVES (behind photo + pill) ================= */}
      <LinearGradient
        colors={['#A49DD2', '#8A84BC', '#817CB5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.waveRight}
      />
      <LinearGradient
        colors={['#C9EBF0', '#97D3DF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.waveBlue}
      />
      <LinearGradient
        colors={['#A39DCF', '#827DB5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.waveLavender}
      />
      <LinearGradient
        colors={['#421A96', '#4A19B0', '#5318CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.waveViolet}
      />

      {/* ================= LEFT COLUMN ================= */}
      <Text style={styles.forText}>For</Text>
      <Text style={styles.receivingText}>{'Receiving a campus\nplacement offer'}</Text>

      <View style={styles.companyBox}>
        {companyLogoUri ? (
          <Image source={{ uri: companyLogoUri }} style={styles.companyLogo} resizeMode="contain" />
        ) : (
          <Text style={styles.companyFallback} numberOfLines={2}>
            {company}
          </Text>
        )}
      </View>

      <GradientText text={company} from="#8A5CF6" to="#4FA3E6" style={styles.companyName} />

      {!!details.packageText && (
        <Text style={styles.packageText}>Package: {details.packageText}</Text>
      )}

      {/* ================= PHOTO ================= */}
      <View style={styles.pinkStripe} />
      <View style={styles.photoRing}>
        {studentPhotoUri ? (
          <Image source={{ uri: studentPhotoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Text style={styles.photoEmptyText}>Student photo</Text>
          </View>
        )}
      </View>

      {/* ================= NAME PILL ================= */}
      <LinearGradient
        colors={['#53289A', '#3A1A70']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.namePill}
      >
        <Text style={[styles.nameText, nameSize(studentName)]}>{studentName}</Text>
      </LinearGradient>
      {!!batchText && <Text style={styles.batchText}>{batchText}</Text>}

      {/* ================= FOOTER ================= */}
      {!!brandKit.contactPhone && (
        <View style={[styles.footerRow, { top: 783 }]}>
          <Text style={styles.phoneIcon}>✆</Text>
          <Text style={styles.footerText}>More Information- {brandKit.contactPhone}</Text>
        </View>
      )}
      {!!brandKit.website && (
        <View style={[styles.footerRow, { top: 813 }]}>
          <GlobeIcon />
          <Text style={styles.footerText}>Visit our website- {brandKit.website}</Text>
        </View>
      )}
      {!!brandKit.department && <Text style={styles.department}>{brandKit.department}</Text>}
    </View>
  );
});

export default PlacementPoster;

const styles = StyleSheet.create({
  canvas: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  loading: { backgroundColor: '#F4F2EC' },

  // Header
  header: { position: 'absolute', left: 0, top: 0, width: POSTER_WIDTH, height: 112 },
  logo: {
    position: 'absolute',
    left: 38,
    top: 6,
    width: 104,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: NAVY, textAlign: 'center' },
  orgBlock: { position: 'absolute', left: 156, top: 11, width: 290 },
  orgBlockNoLogo: { left: 30 },
  orgName: { fontFamily: 'Poppins_700Bold', fontSize: 18.5, lineHeight: 21, color: NAVY },
  orgLocation: { fontFamily: 'Poppins_700Bold', fontSize: 18.5, lineHeight: 21, color: LOCATION_RED },
  badges: { position: 'absolute', right: 22, top: 10, width: 178, height: 92 },

  // Headline
  congrats: {
    position: 'absolute',
    left: 0,
    top: 116,
    width: POSTER_WIDTH,
    textAlign: 'center',
    fontFamily: 'KaushanScript_400Regular',
    fontSize: 62,
    lineHeight: 84,
    color: HEADING_PURPLE,
  },
  subline: {
    position: 'absolute',
    left: 0,
    top: 197,
    width: POSTER_WIDTH,
    textAlign: 'center',
    fontFamily: 'Cinzel_700Bold',
    fontSize: 24,
    lineHeight: 33,
    color: INK,
  },
  sublineAccent: { color: NAVY },

  // Waves
  waveBlue: {
    position: 'absolute',
    left: -150,
    top: 636,
    width: 620,
    height: 300,
    borderRadius: 310,
    transform: [{ rotate: '-6deg' }],
  },
  waveLavender: {
    position: 'absolute',
    left: 60,
    top: 668,
    width: 760,
    height: 300,
    borderRadius: 380,
    transform: [{ rotate: '-9deg' }],
  },
  waveViolet: {
    position: 'absolute',
    left: -360,
    top: 730,
    width: 1180,
    height: 460,
    borderRadius: 590,
    transform: [{ rotate: '-11deg' }],
  },

  // Left column
  forText: {
    position: 'absolute',
    left: 20,
    top: 280,
    width: 240,
    textAlign: 'center',
    fontFamily: 'DancingScript_700Bold',
    fontSize: 36,
    lineHeight: 46,
    color: SCRIPT_BLUE,
  },
  receivingText: {
    position: 'absolute',
    left: 4,
    top: 326,
    width: 272,
    textAlign: 'center',
    fontFamily: 'DancingScript_700Bold',
    fontSize: 33,
    lineHeight: 43,
    color: SCRIPT_BLUE,
  },
  companyBox: {
    position: 'absolute',
    left: 38,
    top: 458,
    width: 184,
    height: 66,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7C3CA',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogo: { width: '100%', height: '100%' },
  companyFallback: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 24,
    color: '#C0262D',
    textAlign: 'center',
  },
  companyName: {
    position: 'absolute',
    left: 0,
    top: 546,
    width: 270,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  },
  packageText: {
    position: 'absolute',
    left: 0,
    top: 584,
    width: 270,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    lineHeight: 24,
    color: HEADING_PURPLE,
  },

  // Photo
  waveRight: {
    position: 'absolute',
    left: 510,
    top: 395,
    width: 220,
    height: 640,
    borderRadius: 60,
    transform: [{ rotate: '20deg' }],
  },
  pinkStripe: {
    position: 'absolute',
    left: 586,
    top: 352,
    width: 110,
    height: 20,
    backgroundColor: '#EE7AE6',
    transform: [{ rotate: '-38deg' }],
  },
  photoRing: {
    position: 'absolute',
    left: 260,
    top: 284,
    width: 374,
    height: 374,
    borderRadius: 187,
    backgroundColor: RING,
    padding: 6,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 181,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoEmpty: { backgroundColor: '#EDE9FB', alignItems: 'center', justifyContent: 'center' },
  photoEmptyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: RING },

  // Name pill
  namePill: {
    position: 'absolute',
    left: 309,
    top: 660,
    width: 278,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  nameText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  batchText: {
    position: 'absolute',
    left: 298,
    top: 713,
    width: 300,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 18.5,
    lineHeight: 24,
    color: '#E6E4F4',
  },

  // Footer
  footerRow: { position: 'absolute', left: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneIcon: { fontSize: 22, lineHeight: 26, color: '#FFFFFF', width: 24, textAlign: 'center' },
  globe: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginHorizontal: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeMeridian: {
    position: 'absolute',
    width: 8,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  globeEquator: { position: 'absolute', width: 17, height: 1.5, backgroundColor: '#FFFFFF' },
  footerText: { fontFamily: 'Poppins_700Bold', fontSize: 21, lineHeight: 28, color: '#FFFFFF' },
  department: {
    position: 'absolute',
    right: 22,
    top: 808,
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 24,
    color: INK,
  },
});
