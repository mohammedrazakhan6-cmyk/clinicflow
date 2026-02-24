import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/Typography';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { Bell, MessageCircle, Video, Calendar, Clock, HeartPulse, Brain, Bone, ArrowUpRight, Stethoscope, Home as HomeIcon, LayoutGrid, Heart, Users } from 'lucide-react-native';

export default function PatientHome({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single();
      setProfile(profileData);

      const { data: apptData } = await supabase.from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['waiting', 'in_consultation'])
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)
        .single();
      setAppointment(apptData || null);
    } catch (e) {
      console.log('Error fetching patient data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.neutral[50] }}>
        {[1, 2, 3].map(i => <SkeletonLoader key={i} width="100%" height={150} style={{ marginBottom: 16 }} />)}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Top Header Gradient Section */}
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[100], theme.colors.neutral[50]]}
          locations={[0, 0.7, 1]}
          style={styles.headerGradient}
        >
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('Profile')}>
              <View style={styles.avatarPlaceholder}>
                <Typography variant="bodyMd" color="primary.500" style={{ fontWeight: 'bold' }}>
                  {profile?.name ? profile.name.charAt(0) : 'S'}
                </Typography>
              </View>
              <View>
                <Typography variant="bodyLg" color="neutral.0" style={{ fontWeight: 'bold' }}>
                  Hi {profile?.name?.split(' ')[0] || 'Sarah'},
                </Typography>
                <Typography variant="caption" color="neutral.0" style={{ opacity: 0.8 }}>
                  Welcome back!
                </Typography>
              </View>
            </TouchableOpacity>

            <View style={styles.navIcons}>
              <TouchableOpacity style={styles.glassIcon}>
                <MessageCircle size={20} color={theme.colors.neutral[0]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassIcon}>
                <Bell size={20} color={theme.colors.neutral[0]} />
              </TouchableOpacity>
            </View>
          </View>

          <Typography variant="h1" color="neutral.0" style={styles.mainTitle}>
            Let's take the next step for your health!
          </Typography>

          {/* Next Appointment Card overlapping gradient */}
          <View style={styles.apptCardContainer}>
            <View style={styles.apptCard}>
              <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold', marginBottom: 16 }}>
                Your Next Appointments {appointment ? '(1)' : '(0)'}
              </Typography>

              {appointment ? (
                <View>
                  <View style={styles.doctorInfoRow}>
                    <View style={styles.doctorAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold' }}>
                        Ronald Richards
                      </Typography>
                      <Typography variant="caption" color="neutral.500">Neurologist</Typography>
                    </View>
                    <View style={styles.videoIconContainer}>
                      <Video size={18} color={theme.colors.primary[500]} />
                    </View>
                  </View>

                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateBadge}>
                      <Calendar size={14} color={theme.colors.neutral[700]} style={{ marginRight: 6 }} />
                      <Typography variant="caption" color="neutral.900">{appointment.date}</Typography>
                    </View>
                    <View style={styles.dateBadge}>
                      <Clock size={14} color={theme.colors.neutral[700]} style={{ marginRight: 6 }} />
                      <Typography variant="caption" color="neutral.900">{appointment.time}</Typography>
                    </View>
                  </View>
                </View>
              ) : (
                <Typography variant="bodyMd" color="neutral.500" align="center" style={{ paddingVertical: 20 }}>
                  No upcoming appointments.
                </Typography>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Specialists Grid Area */}
        <View style={styles.lowerSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Typography variant="bodyLg" color="neutral.500">Pick the</Typography>
              <Typography variant="h2" color="neutral.900" style={{ fontWeight: 'bold' }}>Right Specialist</Typography>
            </View>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => navigation.navigate('DoctorsList')}>
              <ArrowUpRight size={20} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {/* General Physician */}
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DoctorList')}>
              <View style={styles.gridIconWrapRight}>
                <Stethoscope size={24} color={theme.colors.primary[500]} />
              </View>
              <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold' }}>General{'\n'}Physician</Typography>
            </TouchableOpacity>

            {/* Cardiologist */}
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DoctorList')}>
              <View style={styles.gridIconWrapRight}>
                <HeartPulse size={24} color={theme.colors.primary[500]} />
              </View>
              <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold' }}>Cardiologist{'\n'}Doctor</Typography>
            </TouchableOpacity>

            {/* Neurologist */}
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DoctorList')}>
              <View style={styles.gridIconWrapRight}>
                <Brain size={24} color={theme.colors.accent[500]} />
              </View>
              <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold' }}>Neurologist{'\n'}Doctor</Typography>
            </TouchableOpacity>

            {/* Orthopedic */}
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DoctorList')}>
              <View style={styles.gridIconWrapRight}>
                <Bone size={24} color={theme.colors.accent[500]} />
              </View>
              <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold' }}>Orthopedic{'\n'}Doctor</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <View style={styles.floatingNavContainer}>
        <View style={styles.floatingNav}>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
            <LayoutGrid size={24} color={theme.colors.neutral[900]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('DoctorList')}>
            <Stethoscope size={24} color={theme.colors.neutral[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Queue')}>
            <Clock size={24} color={theme.colors.neutral[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('VisitHistory')}>
            <Heart size={24} color={theme.colors.neutral[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Profile')}>
            <Users size={24} color={theme.colors.neutral[600]} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  headerGradient: {
    paddingBottom: 60,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingRight: 16,
    paddingVertical: 6,
    paddingLeft: 6,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  glassIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    paddingHorizontal: 24,
    marginBottom: 40,
    fontWeight: '700',
    fontSize: 34,
    lineHeight: 42,
  },
  apptCardContainer: {
    paddingHorizontal: 24,
    marginTop: -20, // Negative margin to overlap the gradient
  },
  apptCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: 20,
    ...theme.shadow.modal,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.neutral[200], // Placeholder image
  },
  videoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50], // Very light gray
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  lowerSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '47%',
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 24,
    padding: 20,
    height: 150,
    justifyContent: 'flex-end',
    ...theme.shadow.card,
  },
  gridItemActive: {
    backgroundColor: theme.colors.primary[500],
  },
  gridIconWrap: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIconWrapRight: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  floatingNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  floatingNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(235, 238, 242, 0.95)',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'space-between',
    width: '100%',
    ...theme.shadow.modal,
    elevation: 5,
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnActive: {
    backgroundColor: theme.colors.neutral[0],
    ...theme.shadow.card,
  }
});
