import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { LogOut, Users, ListFilter } from 'lucide-react-native';

export default function DoctorHome({ navigation }) {
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardDetails();

    const subAppts = supabase.channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchDashboardDetails)
      .subscribe();

    const subSettings = supabase.channel('public:doctor_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_settings' }, fetchSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(subAppts);
      supabase.removeChannel(subSettings);
    };
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('doctor_settings').select('is_available').limit(1).single();
    if (data) setIsAvailable(data.is_available);
  };

  const fetchDashboardDetails = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('status')
        .eq('date', today)
        .not('status', 'eq', 'cancelled');

      if (data) {
        setStats({
          total: data.length,
          waiting: data.filter(a => a.status === 'waiting' || a.status === 'in_consultation').length,
          completed: data.filter(a => a.status === 'completed').length
        });
      }
      await fetchSettings();
    } catch (e) {
      console.log('Error fetching doctor stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (value) => {
    setIsAvailable(value);
    // Assuming single doctor setup with ID 1
    await supabase.from('doctor_settings').upsert({ id: 1, is_available: value });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <SkeletonLoader width={150} height={32} />
        </View>
        <View style={styles.statsGrid}>
          {[1,2].map(i => <SkeletonLoader key={i} width="48%" height={100} style={{marginBottom: 16}} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Typography variant="bodyLg" color="neutral.700">Welcome,</Typography>
            <Typography variant="h2" color="neutral.900">Dr. Smith</Typography>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color={theme.colors.error[500]} size={24} />
          </TouchableOpacity>
        </View>

        <Card style={styles.toggleCard}>
          <Typography variant="bodyLg" color="neutral.900" style={{flex: 1}}>Accepting Walk-ins & Bookings</Typography>
          <Switch 
            value={isAvailable} 
            onValueChange={toggleAvailability} 
            trackColor={{ false: theme.colors.neutral[100], true: theme.colors.success[500] }}
          />
        </Card>

        <Typography variant="h3" color="neutral.900" style={styles.sectionTitle}>Today's Overview</Typography>
        
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.iconWrapper, {backgroundColor: theme.colors.primary[500]}]}>
              <Users color="#fff" size={24} />
            </View>
            <Typography variant="h1" color="neutral.900">{stats.total}</Typography>
            <Typography variant="bodyMd" color="neutral.700">Total Patients</Typography>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.iconWrapper, {backgroundColor: theme.colors.warning[500]}]}>
              <ListFilter color="#fff" size={24} />
            </View>
            <Typography variant="h1" color="neutral.900">{stats.waiting}</Typography>
            <Typography variant="bodyMd" color="neutral.700">Waiting</Typography>
          </Card>
        </View>

        <TouchableOpacity 
          style={styles.actionBanner}
          onPress={() => navigation.navigate('DailyAppointments')}
        >
          <View style={styles.actionContent}>
            <Typography variant="h3" color="neutral.0">Manage Daily Appointments</Typography>
            <Typography variant="bodyMd" color="neutral.0" style={{marginTop: 4, opacity: 0.9}}>View list, start consultations, mark no-shows</Typography>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  scrollContent: {
    padding: theme.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  logoutBtn: {
    padding: theme.spacing[2],
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  sectionTitle: {
    marginBottom: theme.spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[8],
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  actionBanner: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.radius.lg,
    padding: theme.spacing[5],
    ...theme.shadow.card,
  },
  actionContent: {
    flex: 1,
  },
});
