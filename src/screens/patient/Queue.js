import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Queue({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserAppt, setCurrentUserAppt] = useState(null);
  const [doctorSettings, setDoctorSettings] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchQueueAndSettings();

    // Real-time subscription for queue updates
    const sub = supabase
      .channel('queue-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `date=eq.${today}` },
        fetchQueueAndSettings
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const fetchQueueAndSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch settings for estimated time
      const { data: settings } = await supabase.from('doctor_settings').select('slot_duration').single();
      setDoctorSettings(settings || { slot_duration: 15 });

      // Fetch all waiting or in-consultation appointments for today
      const { data: qData } = await supabase
        .from('appointments')
        .select(`
          id, queue_order, status, time, patient_id, token_number,
          users (name)
        `)
        .eq('date', today)
        .in('status', ['waiting', 'in_consultation'])
        .order('queue_order', { ascending: true });

      setAppointments(qData || []);

      const myAppt = qData?.find(a => a.patient_id === user.id);
      setCurrentUserAppt(myAppt || null);
    } catch (e) {
      console.log('Error fetching queue:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1, padding: 24 }}>
          <SkeletonLoader width="100%" height={160} borderRadius={24} style={{ marginBottom: 24 }} />
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            <SkeletonLoader width="47%" height={100} borderRadius={20} />
            <SkeletonLoader width="47%" height={100} borderRadius={20} />
          </View>
          <SkeletonLoader width="100%" height={300} borderRadius={24} />
        </SafeAreaView>
      </View>
    );
  }

  const myIndex = appointments.findIndex(a => a.id === currentUserAppt?.id);
  const myPos = myIndex !== -1 ? myIndex + 1 : null;
  const currentServing = appointments.find(a => a.status === 'in_consultation') || appointments[0]; // fallback to first waiting if none in consultation
  const estWaitTime = myIndex > 0 ? myIndex * (doctorSettings?.slot_duration || 15) : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={24} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
            <Typography variant="h2" color="neutral.900">Live Queue</Typography>
          </View>

          {currentUserAppt ? (
            <Card style={styles.statusCard}>
              <View style={styles.tokenSection}>
                <Typography variant="caption" color="neutral.100" style={{ opacity: 0.8 }}>Token Number</Typography>
                <Typography variant="h1" color="neutral.0" style={styles.tokenText}>
                  #{currentUserAppt.token_number || currentUserAppt.queue_order}
                </Typography>
              </View>

              <View style={styles.divider} />

              <View style={styles.positionRow}>
                <View style={styles.posItem}>
                  <Typography variant="caption" color="neutral.100" style={{ opacity: 0.8 }}>Position</Typography>
                  <Typography variant="h3" color="neutral.0">#{myPos}</Typography>
                </View>
                <View style={styles.posItem}>
                  <Typography variant="caption" color="neutral.100" style={{ opacity: 0.8 }}>Est. Wait</Typography>
                  <Typography variant="h3" color="neutral.0">{estWaitTime}m</Typography>
                </View>
              </View>
            </Card>
          ) : (
            <View style={styles.emptyState}>
              <Typography variant="bodyLg" color="neutral.500" align="center">
                You have no active appointment.
              </Typography>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Typography variant="h3" color="neutral.900">{appointments.length}</Typography>
              <Typography variant="caption" color="neutral.500">Total Waiting</Typography>
            </View>
            <View style={styles.statBox}>
              <Typography variant="h3" color="warning.500">
                {currentServing?.status === 'in_consultation' ? `#${currentServing.token_number || currentServing.queue_order}` : 'None'}
              </Typography>
              <Typography variant="caption" color="neutral.500">Now Serving</Typography>
            </View>
          </View>

          <Typography variant="h3" color="neutral.900" style={{ marginBottom: 16 }}>Queue Sequence</Typography>

          <View style={styles.queueContainer}>
            {appointments.map((appt, idx) => {
              const isMe = appt.patient_id === currentUserAppt?.patient_id;
              const isInConsultation = appt.status === 'in_consultation';

              return (
                <View key={appt.id} style={[styles.queueItem, isMe && styles.myQueueItem]}>
                  <View style={[styles.posCircle, isInConsultation && { backgroundColor: theme.colors.warning[500] }]}>
                    <Typography variant="bodyLg" color="neutral.0">{idx + 1}</Typography>
                  </View>
                  <View style={styles.queueInfo}>
                    <Typography variant="bodyLg" color={isMe ? 'primary.500' : 'neutral.900'} style={{ fontWeight: isMe ? 'bold' : '600' }}>
                      {isMe ? 'You (Me)' : `Token #${appt.token_number || appt.queue_order}`}
                    </Typography>
                    <Typography variant="caption" color="neutral.500">{appt.time}</Typography>
                  </View>
                  {isInConsultation && (
                    <View style={styles.servingBadge}>
                      <Typography variant="caption" color="warning.600" style={{ fontWeight: 'bold' }}>SERVING</Typography>
                    </View>
                  )}
                </View>
              );
            })}

            {appointments.length === 0 && (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Typography variant="bodyMd" color="neutral.400">The queue is currently empty.</Typography>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.card,
    elevation: 2,
  },
  statusCard: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...theme.shadow.card,
    elevation: 4,
  },
  tokenSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenText: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '800',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posItem: {
    alignItems: 'center',
    flex: 1,
  },
  emptyState: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 24,
    padding: 40,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.neutral[200],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.neutral[0],
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    ...theme.shadow.card,
    elevation: 2,
  },
  queueContainer: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 24,
    padding: 16,
    ...theme.shadow.card,
    elevation: 2,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.neutral[50],
  },
  myQueueItem: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  posCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  queueInfo: {
    flex: 1,
  },
  servingBadge: {
    backgroundColor: theme.colors.warning[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  }
});
