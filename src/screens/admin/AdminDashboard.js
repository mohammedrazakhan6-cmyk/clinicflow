import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { LogOut, Users, Settings, UserPlus, ListFilter, CalendarDays, LayoutGrid, User, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminBottomNav } from '../../components/AdminBottomNav';
import { StatusPill } from '../../components/StatusPill';

export default function AdminDashboard({ navigation }) {
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0, avgWait: 0 });
  const [appointmentsPreview, setAppointmentsPreview] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorSettingsMap, setDoctorSettingsMap] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState('all'); // 'all' or doctor_id
  const [loading, setLoading] = useState(true);

  console.log("appointmentsPreview state:", appointmentsPreview);

  useFocusEffect(
    useCallback(() => {
      fetchStats(selectedDoctor);

      const sub = supabase.channel('public:appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchStats(selectedDoctor))
        .subscribe();

      return () => supabase.removeChannel(sub);
    }, [selectedDoctor])
  );

  const fetchStats = async (currentDoctorId) => {
    try {
      // 1. Fetch doctors for tabs if not already fetched
      if (doctors.length === 0) {
        const { data: docs } = await supabase.from('users').select('*').eq('role', 'doctor');
        if (docs) setDoctors(docs);
      }

      const today = new Date().toLocaleDateString('en-CA');

      console.log("Today value:", today);

      // 2. Fetch Aggregated Metrics
      let totalQuery = supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today);
      let waitingQuery = supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).in('status', ['waiting', 'in_consultation']);
      let completedQuery = supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'completed');

      if (currentDoctorId !== 'all') {
        totalQuery = totalQuery.eq('doctor_id', currentDoctorId);
        waitingQuery = waitingQuery.eq('doctor_id', currentDoctorId);
        completedQuery = completedQuery.eq('doctor_id', currentDoctorId);
      }

      const { count: total } = await totalQuery;
      const { count: waiting } = await waitingQuery;
      const { count: completed } = await completedQuery;

      // 3. Fetch Preview List
      let previewQuery = supabase
        .from('appointments')
        .select(`
          id, status, queue_order, time, token, patient_id, walk_in_id,
          users!appointments_patient_id_fkey (name),
          walk_ins (name)
        `)
        .eq('date', today)
        .in('status', ['waiting', 'in_consultation'])
        .order('queue_order', { ascending: true })
        .limit(4);

      if (currentDoctorId !== 'all') {
        previewQuery = previewQuery.eq('doctor_id', currentDoctorId);
      }

      const { data: apptsPreview, error: previewError } = await previewQuery;

      console.log("Preview Data:", apptsPreview);
      console.log("Preview Error:", previewError);

      if (previewError) {
        console.log("Preview error:", previewError);
      }

      setAppointmentsPreview(apptsPreview || []);

      // 4. Fetch Doctor Settings
      const { data: settings } = await supabase.from('doctor_settings').select('*').limit(1).single();
      const slotDuration = settings?.slot_duration || 15;

      setStats({
        total: total || 0,
        waiting: waiting || 0,
        completed: completed || 0,
        avgWait: (waiting || 0) * slotDuration
      });

      if (settings) {
        setDoctorSettingsMap({ 'all': settings }); // Mocking map since we only have one settings row in SQL
      }
    } catch (e) {
      console.log('Error fetching admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (settings) => {
    if (!settings || !settings.is_available) {
      return { label: 'Unavailable', style: styles.statusUnavailable, color: 'neutral.0' };
    }

    // Check if within hours
    const now = new Date();
    const currTime = now.getHours() * 60 + now.getMinutes();

    if (settings.start_time && settings.end_time) {
      const startParts = settings.start_time.split(':');
      const endParts = settings.end_time.split(':');
      const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currTime < startMins || currTime > endMins) {
        return { label: 'Break/Off-hours', style: styles.statusBreak, color: 'neutral.0' };
      }
    }

    return { label: 'Available', style: styles.statusAvailable, color: 'neutral.0' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader width={150} height={32} style={{ margin: 16 }} />
        <View style={styles.grid}>
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} width="46%" height={100} style={{ marginBottom: 16 }} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.neutral[50], theme.colors.neutral[50]]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />
      <ScrollView contentContainerStyle={{ padding: theme.spacing[4] }}>

        <View style={styles.header}>
          <Typography variant="h2" color="neutral.0">Admin Dashboard</Typography>
        </View>

        {/* Doctor Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={{ paddingRight: theme.spacing[4] }}>
          {doctors.map(doc => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.tab, selectedDoctor === doc.id && styles.tabActive]}
              onPress={() => setSelectedDoctor(doc.id)}
            >
              <Typography variant="bodyMd" color={selectedDoctor === doc.id ? 'neutral.0' : 'neutral.700'} style={{ fontWeight: '600' }}>
                {doc.name}
              </Typography>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.tab, selectedDoctor === 'all' && styles.tabActive]}
            onPress={() => setSelectedDoctor('all')}
          >
            <Typography variant="bodyMd" color={selectedDoctor === 'all' ? 'neutral.0' : 'neutral.700'} style={{ fontWeight: '600' }}>
              All Doctors
            </Typography>
          </TouchableOpacity>
        </ScrollView>

        {selectedDoctor !== 'all' && doctors.find(d => d.id === selectedDoctor) && (
          <View style={styles.profileCard}>
            <View style={{ flexDirection: 'row', zIndex: 1 }}>
              <View style={{ flex: 1, paddingRight: 80 }}>
                <View style={styles.profileHeader}>
                  <View style={styles.idBadge}>
                    <Typography variant="caption" color="neutral.700" style={{ fontWeight: '600' }}>
                      ID: {doctors.find(d => d.id === selectedDoctor).id.split('-')[1] || '0269784'}
                    </Typography>
                  </View>
                </View>

                <Typography variant="h1" color="neutral.900" style={styles.doctorName}>
                  {doctors.find(d => d.id === selectedDoctor).name}
                </Typography>
                <Typography variant="bodyLg" color="neutral.500" style={styles.specialty}>
                  General Physician
                </Typography>

                <View style={styles.profileBadges}>
                  <View style={[
                    styles.statusBadge,
                    getStatusDisplay(doctorSettingsMap['all']).style
                  ]}>
                    <Typography variant="caption" color={getStatusDisplay(doctorSettingsMap['all']).color} style={{ fontWeight: 'bold' }}>
                      {getStatusDisplay(doctorSettingsMap['all']).label}
                    </Typography>
                  </View>
                  <View style={styles.recordBadge}>
                    <Users size={14} color={theme.colors.primary[600]} style={{ marginRight: 6 }} />
                    <Typography variant="caption" color="neutral.900" style={{ fontWeight: '700' }}>
                      120+
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
            <Image
              source={require('../../../assets/onboarding/doctorprofile.png')}
              style={styles.doctorImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.grid}>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{ marginBottom: 8 }}>Total Patients</Typography>
            <Typography variant="h1" color="neutral.900">{stats.total}</Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{ marginBottom: 8 }}>Currently Waiting</Typography>
            <Typography variant="h1" color="neutral.900">{stats.waiting}</Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{ marginBottom: 8 }}>Completed</Typography>
            <Typography variant="h1" color="neutral.900">{stats.completed}</Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{ marginBottom: 8 }}>Est. Wait Time</Typography>
            <Typography variant="h1" color="neutral.900">{stats.avgWait}m</Typography>
          </Card>
        </View>

        {/* List Section mimicking "Trending Items" */}
        <Card style={styles.listSection}>
          <View style={styles.listHeader}>
            <Typography variant="h3" color="neutral.900">Live Queue</Typography>
            <TouchableOpacity onPress={() => navigation.navigate('AdminAppointments')} style={styles.seeAllBtn}>
              <Typography variant="bodyMd" color="neutral.700" style={{ fontWeight: '500' }}>See All</Typography>
            </TouchableOpacity>
          </View>

          {appointmentsPreview.map((appt, idx) => (
            <View key={appt.id} style={[styles.listItem, idx === appointmentsPreview.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.listAvatar}>
                <Typography variant="bodyLg" color="primary.600" style={{ fontWeight: 'bold' }}>
                  {(appt.users?.name || appt.walk_ins?.name || 'P').charAt(0)}
                </Typography>
              </View>
              <View style={styles.listInfo}>
                <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: '600' }}>
                  {appt.users?.name || appt.walk_ins?.name || 'Walk-in'}
                </Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <StatusPill status={appt.status} style={{ paddingVertical: 2, paddingHorizontal: 8 }} />
                  {selectedDoctor === 'all' && (
                    <Typography variant="caption" color="neutral.500" style={{ marginLeft: 6 }}>
                      • {appt.doctors?.name}
                    </Typography>
                  )}
                </View>
              </View>
              <View style={styles.listMetrics}>
                <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: '600', textAlign: 'right' }}>#{appt.queue_order}</Typography>
                <Typography variant="caption" color="primary.500" style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {appt.time}
                </Typography>
              </View>
            </View>
          ))}

          {appointmentsPreview.length === 0 && (
            <Typography variant="bodyMd" color="neutral.500" style={{ textAlign: 'center', marginVertical: 24 }}>
              Queue is empty.
            </Typography>
          )}
        </Card>

        {/* Empty space at the bottom to allow scrolling past the floating nav */}
        <View style={{ height: 40 }} />

      </ScrollView>

      {/* Persistent Bottom Nav */}
      <AdminBottomNav navigation={navigation} activeRoute="AdminDashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[6],
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.neutral[100],
    marginRight: theme.spacing[3],
  },
  tabActive: {
    backgroundColor: theme.colors.primary[500],
  },
  profileCard: {
    backgroundColor: '#E8F0F2', // Light frost blue matching reference
    borderRadius: 24,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[6],
    marginTop: 10,
    minHeight: 240,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing[4],
  },
  idBadge: {
    backgroundColor: theme.colors.neutral[0],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  doctorName: {
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 4,
  },
  specialty: {
    marginBottom: theme.spacing[6],
  },
  profileBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.radius.full,
    ...theme.shadow.card,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    ...theme.shadow.card,
  },
  statusAvailable: {
    backgroundColor: theme.colors.success[500],
  },
  statusBreak: {
    backgroundColor: theme.colors.warning[500],
  },
  statusUnavailable: {
    backgroundColor: theme.colors.error[500],
  },
  doctorImage: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    width: 180,
    height: 240,
    zIndex: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[6],
  },
  statCard: {
    width: '48%',
    marginBottom: theme.spacing[4],
    alignItems: 'flex-start',
    padding: theme.spacing[4],
  },
  listSection: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  seeAllBtn: {
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  listInfo: {
    flex: 1,
  },
  listMetrics: {
    alignItems: 'flex-end',
  },
  sectionTitle: {
    marginBottom: theme.spacing[4],
  }
});
