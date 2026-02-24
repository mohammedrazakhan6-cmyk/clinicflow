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

  useEffect(() => {
    // Mocking initial data fetch
    setStats({
      total: 12,
      waiting: 4,
      consulting: 1,
      completed: 7,
    });

    setNextPatient({
      id: '1',
      token_number: 105,
      appointment_time: '10:30 AM',
      status: 'waiting',
      patients: { full_name: 'Amara Walker' }
    });

    setAppointments([
      { id: '1', token_number: 105, appointment_time: '10:30 AM', status: 'waiting', patients: { full_name: 'Amara Walker' } },
      { id: '2', token_number: 106, appointment_time: '11:00 AM', status: 'waiting', patients: { full_name: 'James Cooper' } },
      { id: '3', token_number: 107, appointment_time: '11:30 AM', status: 'completed', patients: { full_name: 'Elena Rodriguez' } },
    ]);

    setLoading(false);
    setRealtimeConnected(true); // Faking connection for UI

    // Commenting out Supabase logic for now
    /*
    fetchInitialData();
    setupSubscriptions();
    
    return () => {
      supabase.channel('doctor-dashboard').unsubscribe();
    };
    */
  }, []);

  const fetchInitialData = async () => {
    // Bypassing for mock
  };

  const setupSubscriptions = () => {
    // Bypassing for mock
  };

  const handleUpdateStatus = (appointmentId, newStatus) => {
    // Mock local state update
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
    if (nextPatient && nextPatient.id === appointmentId) {
      setNextPatient(prev => ({ ...prev, status: newStatus }));
    }
    // Update stats based on mock change if needed
  };

  const updateAvailability = (status) => {
    setAvailability(status);
    // Bypassing Supabase for mock
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
            doctorName="Dr. Rajesh Sharma"
            specialty="Senior Neurologist"
            price="1.2k"
            rating="4.8"
            experience="15"
            patientsServed="500"
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
              {['available', 'break', 'unavailable'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.availabilityPill,
                    availability === status && styles.activePill,
                    availability === status && status === 'available' && { backgroundColor: theme.colors.success[500] },
                    availability === status && status === 'break' && { backgroundColor: theme.colors.warning[500] },
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
                  <Typography style={styles.tokenNumber}>#{nextPatient.token_number}</Typography>
                </View>
                <StatusBadge status={nextPatient.status} />
              </View>

              <View style={styles.patientInfoContainer}>
                <Typography style={styles.patientName}>{nextPatient.patients.full_name}</Typography>
                <Typography variant="bodyMd" color="neutral.500">{nextPatient.appointment_time} • Scheduled</Typography>
              </View>

              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => handleUpdateStatus(nextPatient.id, 'in_consultation')}
              >
                <Typography variant="button" color="neutral.0">Start Consultation</Typography>
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
                    <Typography variant="caption" color="neutral.500">{item.appointment_time}</Typography>
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
