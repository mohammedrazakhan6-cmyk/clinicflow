import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/Typography';
import { theme } from '../../styles/theme';
import { ArrowLeft, Search, SlidersHorizontal, HeartPulse, Brain, ChevronRight, User } from 'lucide-react-native';

const maleDoc = require('../../../assets/onboarding/maleDoc.png');
const femaleDoc = require('../../../assets/onboarding/femaleDoc.png');

import { supabase } from '../../api/supabase';

export default function DoctorList({ navigation }) {
  const [doctors, setDoctors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor');

      if (fetchError) throw fetchError;

      // Transform data for UI
      const transformedDoctors = (data || []).map((doc, index) => ({
        id: doc.id,
        name: doc.name,
        role: 'General Physician', // Fallback as 'role' in users table might be just 'doctor'
        tags: 'Health, Screening & treatment', // Static for now
        price: '₹1000', // Static for now
        icon: index % 2 === 0 ? <HeartPulse size={16} color={theme.colors.primary[500]} /> : <Brain size={16} color={theme.colors.accent[500]} />,
        colorType: index % 2 === 0 ? 'primary' : 'neutral',
        image: index % 2 === 0 ? maleDoc : femaleDoc,
      }));

      setDoctors(transformedDoctors);
    } catch (e) {
      console.error('Error fetching doctors:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const renderItem = ({ item }) => {
    const isPrimary = item.colorType === 'primary';

    const cardContent = (
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={styles.profileWrapper}>
            {item.image ? (
              <Image source={item.image} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.fallbackAvatar]}>
                <Typography variant="h3" color="primary.500">
                  {item.name.split(' ').map(n => n[0]).join('')}
                </Typography>
              </View>
            )}
            <View style={styles.specIconBadge}>
              {item.icon}
            </View>
          </View>

          <View style={styles.headerText}>
            <Typography variant="bodyLg" color={isPrimary ? 'neutral.0' : 'neutral.900'} style={{ fontWeight: 'bold' }}>
              {item.name}
            </Typography>
            <Typography variant="caption" color={isPrimary ? 'neutral.0' : 'neutral.500'} style={{ opacity: isPrimary ? 0.9 : 1 }}>
              {item.role}
            </Typography>
          </View>
        </View>

        <Typography variant="bodyMd" color={isPrimary ? 'neutral.0' : 'neutral.900'} style={styles.tagsText}>
          {item.tags}
        </Typography>

        <View style={styles.priceRow}>
          <View>
            <Typography variant="caption" color={isPrimary ? 'neutral.0' : 'neutral.500'} style={{ opacity: isPrimary ? 0.8 : 1 }}>
              Starting from
            </Typography>
            <Typography variant="bodyLg" color={isPrimary ? 'neutral.0' : 'neutral.900'} style={{ fontWeight: 'bold' }}>
              {item.price} <Typography variant="caption" color={isPrimary ? 'neutral.0' : 'neutral.500'}>/per session</Typography>
            </Typography>
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, isPrimary ? styles.bookBtnLight : styles.bookBtnDark]}
            onPress={() => navigation.navigate('BookAppointment', { doctorId: item.id })}
          >
            <Typography variant="bodyMd" color={isPrimary ? 'primary.600' : 'neutral.500'} style={{ fontWeight: '600', marginRight: 8 }}>
              Book Now
            </Typography>
            <View style={[styles.arrowCircle, isPrimary ? { backgroundColor: theme.colors.primary[500] } : { backgroundColor: theme.colors.neutral[200] }]}>
              <ChevronRight size={16} color={isPrimary ? '#fff' : theme.colors.neutral[500]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );

    if (isPrimary) {
      return (
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[100]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardContainer}
        >
          {cardContent}
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.neutral[0] }]}>
        {cardContent}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Search size={20} color={theme.colors.neutral[900]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <SlidersHorizontal size={20} color={theme.colors.neutral[900]} />
          </TouchableOpacity>
        </View>
      </View>

      <Typography variant="h1" color="neutral.900" style={styles.title}>
        Find the right{'\n'}doctor for you
      </Typography>

      {loading ? (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <Typography variant="bodyMd">Loading doctors...</Typography>
        </View>
      ) : error ? (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <Typography variant="bodyMd" color="error.500">Error: {error}</Typography>
        </View>
      ) : doctors.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <Typography variant="bodyMd">No doctors found.</Typography>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50], // Light background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    paddingHorizontal: 24,
    marginBottom: 32,
    fontWeight: '700',
    fontSize: 34,
    lineHeight: 40,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  cardContainer: {
    borderRadius: 32,
    height: 220,
    overflow: 'hidden',
    ...theme.shadow.modal,
  },
  cardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  profileWrapper: {
    padding: 2,
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 34,
    ...theme.shadow.card,
    elevation: 4,
    marginRight: 16,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.neutral[0],
  },
  fallbackAvatar: {
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  specIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.colors.neutral[0],
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.card,
    elevation: 2,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  tagsText: {
    width: '100%',
    fontWeight: '500',
    marginTop: 20,
    zIndex: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 24,
  },
  bookBtnLight: {
    backgroundColor: theme.colors.neutral[0],
  },
  bookBtnDark: {
    backgroundColor: theme.colors.neutral[100],
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
