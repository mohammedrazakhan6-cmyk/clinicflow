import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeroSection } from '../../components/HeroSection';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ChevronRight, MoreVertical, Dot } from 'lucide-react-native';

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  const [h, m] = timeStr.split(':');
  let hour = parseInt(h);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${m} ${period}`;
};

export default function DoctorHome({ navigation }) {
  const [stats, setStats] = useState({ total: 0, waiting: 0, consulting: 0, completed: 0 });
  const [nextPatient, setNextPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState('available');
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchInitialData();
    setupSubscriptions();

    return () => {
      supabase.channel('doctor-dashboard').unsubscribe();
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // Fetch Today's Appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: appts, error: apptsError } = await supabase
        .from('appointments')
        .select(`
  id,
  token,
  status,
  time,
  patient_id,
  walk_in_id,
  users!appointments_patient_id_fkey (name),
  walk_ins!appointments_walk_in_id_fkey (name)
`)
        .gte('date', today)
        .eq('doctor_id', user.id)
        .order('queue_order', { ascending: true });

      if (apptsError) throw apptsError;

      const transformedAppts = (appts || []).map(a => ({
        id: a.id,
        token_number: a.token,   // 👈 FIX
        appointment_time: formatTime(a.time),
        status: a.status,
        patients: { full_name: a.users?.name || a.walk_ins?.name || 'Unknown' }
      }));

      setAppointments(transformedAppts);

      // Calculate Stats
      const stats = {
        total: transformedAppts.length,
        waiting: transformedAppts.filter(a => a.status === 'waiting').length,
        consulting: transformedAppts.filter(a => a.status === 'in_consultation').length,
        completed: transformedAppts.filter(a => a.status === 'completed').length,
      };
      setStats(stats);

      // Next Patient
      const next = transformedAppts.find(a => a.status === 'waiting');
      setNextPatient(next || null);

      // Fetch Availability
      // const { data: settings } = await supabase.from('doctor_settings').select('is_available').limit(1).single();
      const { data: settings } = await supabase
        .from('doctor_settings')
        .select('status')
        .eq('doctor_id', user.id)
        .single();

      setAvailability(settings?.status || 'available');

    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptions = () => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .channel('doctor-dashboard')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `date=eq.${today}` },
        () => fetchInitialData()
      )
      .subscribe();
    setRealtimeConnected(true);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      fetchInitialData(); // Refresh via polling fallback or wait for realtime
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const updateAvailability = async (status) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('doctor_settings')
        .update({ status })
        .eq('doctor_id', user.id);

      if (error) throw error;

      setAvailability(status);

    } catch (e) {
      console.log('Availability update error:', e);
    }
  };

  const showConfirm = (config) => {
    setModalConfig(config);
    setModalVisible(true);
  };

  const renderWorkloadCard = (label, value, dotColor) => (
    <Card style={styles.workloadCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Typography variant="h2" style={styles.cardValue}>{value}</Typography>
      </View>
      <Typography variant="caption" color="neutral.500" style={styles.cardLabel}>{label}</Typography>
    </Card>
  );

  const renderSectionHeader = (title, actionLabel) => (
    <View style={styles.sectionHeader}>
      <Typography variant="h3" color="neutral.900">{title}</Typography>
      {actionLabel && (
        <TouchableOpacity>
          <Typography variant="bodyMd" color="primary.500" style={{ fontWeight: '600' }}>{actionLabel}</Typography>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.topHeader}>
          <HeroSection
            doctorName={profile?.name || "Dr. Rajesh Sharma"}
            specialty={profile?.role || "Senior Neurologist"}
            price="1k"
            rating="4.8"
            experience="10"
            patientsServed="120"
            navigation={navigation}
            onLogout={() => {
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  onPress: async () => {
                    await supabase.auth.signOut();
                  },
                }
              ]);
            }}
          />
        </View>

        <View style={styles.mainContent}>
          {/* Availability Control - Segmented Pill */}
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="neutral.900" style={styles.sectionTitle}>Your Status</Typography>
          </View>
          <View style={styles.availabilityContainer}>
            <View style={styles.segmentedControl}>
              {['available', 'unavailable'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.availabilityPill,
                    availability === status && styles.activePill,
                    availability === status && status === 'available' && { backgroundColor: theme.colors.success[500] },
                    availability === status && status === 'unavailable' && { backgroundColor: theme.colors.error[500] },
                  ]}
                  onPress={() => {
                    if (status === 'unavailable') {
                      showConfirm({
                        title: "Go Offline?",
                        message: "Patients won't be able to book or queue while you are unavailable.",
                        confirmText: "Go Offline",
                        destructrive: true,
                        onConfirm: () => {
                          updateAvailability('unavailable');
                          setModalVisible(false);
                        }
                      });
                    } else {
                      updateAvailability(status);
                    }
                  }}
                >
                  <Typography
                    variant="caption"
                    style={[styles.pillText, availability === status && { color: '#fff', fontWeight: '700' }]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Workload Summary - 2x2 Grid */}
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="neutral.900" style={styles.sectionTitle}>Workload Summary</Typography>
          </View>
          {loading ? (
            <View style={styles.workloadGrid}>
              {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} width="48%" height={100} style={{ marginBottom: 16 }} />)}
            </View>
          ) : (
            <View style={styles.workloadGrid}>
              {renderWorkloadCard('Total Today', stats.total, theme.colors.primary[500])}
              {renderWorkloadCard('Waiting', stats.waiting, '#F59E0B')}
              {renderWorkloadCard('In Consultation', stats.consulting, '#3B82F6')}
              {renderWorkloadCard('Completed', stats.completed, '#10B981')}
            </View>
          )}

          {/* Next Patient Priority Card - Dominant */}
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="neutral.900" style={styles.sectionTitle}>Next Patient</Typography>
          </View>
          {loading ? (
            <SkeletonLoader width="100%" height={160} style={{ marginBottom: 24 }} />
          ) : nextPatient ? (
            <Card style={styles.priorityCard}>
              <View style={styles.priorityHeader}>
                <View style={styles.tokenBadge}>
                  <Typography variant="caption" color="neutral.500" style={{ fontWeight: '600' }}>TOKEN</Typography>
                  <Typography style={styles.tokenNumber}>#{nextPatient.token_number || nextPatient.queue_order}</Typography>
                </View>
                <StatusBadge status={nextPatient.status} />
              </View>

              <View style={styles.patientInfoContainer}>
                <Typography style={styles.patientName}>{nextPatient.patients.full_name}</Typography>
                <Typography variant="bodyMd" color="neutral.500">{nextPatient.appointment_time} • {nextPatient.walk_ins ? 'Walk-in' : 'Scheduled'}</Typography>
              </View>

              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => handleUpdateStatus(nextPatient.id, nextPatient.status === 'waiting' ? 'in_consultation' : 'completed')}
              >
                <Typography variant="button" color="neutral.0">
                  {nextPatient.status === 'waiting' ? 'Start Consultation' : 'Mark Completed'}
                </Typography>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Typography variant="bodyMd" color="neutral.500" align="center">No patients waiting in queue</Typography>
            </Card>
          )}

          {/* Today's Appointment List Preview */}
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="neutral.900" style={styles.sectionTitle}>Today's Appointments</Typography>
            <TouchableOpacity>
              <Typography variant="bodyMd" color="primary.500" style={{ fontWeight: '600' }}>View All</Typography>
            </TouchableOpacity>
          </View>
          {loading ? (
            [1, 2, 3].map(i => <SkeletonLoader key={i} width="100%" height={80} style={{ marginBottom: 16 }} />)
          ) : appointments.length > 0 ? (
            <View style={styles.listContainer}>
              {appointments.map((item, index) => (
                <TouchableOpacity key={item.id} style={[styles.listItem, index === appointments.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.listItemMain}>
                    <Typography style={styles.listItemName}>{item.patients.full_name}</Typography>
                    <Typography variant="caption" color="neutral.500">{item.appointment_time} • {item.walk_ins ? 'Walk-in' : 'Scheduled'}</Typography>
                  </View>
                  <View style={styles.listItemRight}>
                    <StatusBadge status={item.status} />
                    <ChevronRight size={18} color={theme.colors.neutral[300]} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Typography variant="bodyMd" color="neutral.500" align="center" style={{ marginTop: 16 }}>No appointments scheduled for today</Typography>
          )}

        </View>
      </ScrollView>

      <ConfirmationModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalVisible(false)}
        confirmText={modalConfig.confirmText}
        destructrive={modalConfig.destructrive}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  topHeader: {
    position: 'relative',
  },
  liveIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    ...theme.shadow.card,
    zIndex: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: -8, // Pull up slightly into the hero section curves
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  availabilityContainer: {
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 4,
    borderRadius: 16,
    gap: 4,
  },
  availabilityPill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activePill: {
    ...theme.shadow.card,
  },
  pillText: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },
  workloadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workloadCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.neutral[900],
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  priorityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
    ...theme.shadow.card,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tokenBadge: {
    gap: 2,
  },
  tokenNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.neutral[900],
  },
  patientInfoContainer: {
    marginBottom: 24,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    marginBottom: 4,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    ...theme.shadow.card,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemMain: {
    gap: 4,
  },
  listItemName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    backgroundColor: 'transparent',
  },
});
