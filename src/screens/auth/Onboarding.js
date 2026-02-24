import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/Typography';
import { theme } from '../../styles/theme';

const SLIDES = [
  {
    id: '1',
    title: 'Find the Right Doctor',
    description: 'Easily search and discover top specialists near you. Your health journey starts with the perfect match.',
    image: require('../../../assets/onboarding/doctor.png')
  },
  {
    id: '2',
    title: 'Seamles  Appointments',
    description: 'Book in-clinic or virtual consultations in seconds. Say goodbye to long waiting times on the phone.',
    image: require('../../../assets/onboarding/calendar.png')
  },
  {
    id: '3',
    title: 'Track Your Health',
    description: 'Manage your visits, live queues, and consultation history all in one secure, convenient place.',
    image: require('../../../assets/onboarding/health.png')
  }
];

export default function Onboarding({ navigation }) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentIndex(Math.round(index));
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.navigate('Register');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Register');
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8fb8c6', '#FAFAFF', '#FAFAFF']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top Bar with Skip */}
        <View style={styles.topBar}>
          {!isLastSlide && (
            <TouchableOpacity onPress={handleSkip}>
              <Typography variant="bodyMd" color="primary.600" style={{ fontWeight: '600' }}>
                Skip
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {/* Carousel list */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
              </View>
              <View style={styles.textContainer}>
                <Typography variant="h2" color="neutral.900" style={styles.title}>
                  {item.title}
                </Typography>
                <Typography variant="bodyLg" color="neutral.500" style={styles.description}>
                  {item.description}
                </Typography>

                {/* Pagination under text */}
                <View style={styles.pagination}>
                  {SLIDES.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        currentIndex === i ? styles.dotActive : styles.dotInactive
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        />

        {/* Bottom Area: Action Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
            <Typography variant="bodyLg" color="neutral.0" style={{ fontWeight: '500' }}>
              {isLastSlide ? "Get Started" : "Next"}
            </Typography>
          </TouchableOpacity>

          {isLastSlide ? (
            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Typography variant="caption" color="neutral.900" style={{ fontWeight: 'bold' }}>
                Already have an account? <Typography variant="caption" color="primary.600" style={{ fontWeight: 'bold' }}>Log in</Typography>
              </Typography>
            </TouchableOpacity>
          ) : (
            <View style={styles.loginLinkPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    height: 48,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  imageContainer: {
    height: '55%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  textContainer: {
    alignItems: 'flex-start',
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 26,
    lineHeight: 34,
  },
  description: {
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#347b8d',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#d5e0e3',
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32, // Reduced bottom padding to push UI down
    marginTop: 8, // Added margin top to shift 8px down
    width: '100%',
  },
  actionBtn: {
    backgroundColor: '#347b8d',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  loginLinkPlaceholder: {
    marginTop: 20,
    height: 24,
  }
});
