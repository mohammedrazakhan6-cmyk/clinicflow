import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function Queue({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserAppt, setCurrentUserAppt] = useState(null);

  useEffect(() => {
    fetchQueue();

    const sub = supabase
      .channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchQueue)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const fetchQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().split('T')[0];

      // Fetch all waiting or in-consultation appointments for today ordered by queue_order or time
      const { data: qData } = await supabase
        .from('appointments')
        .select(`
          id, queue_order, status, time, patient_id,
          users (name)
        `)
        .eq('date', today)
        .in('status', ['waiting', 'in_consultation'])
        .order('queue_order', { ascending: true })
        .order('time', { ascending: true });

      setAppointments(qData || []);
      
      const myAppt = qData?.find(a => a.patient_id === user.id);
      setCurrentUserAppt(myAppt || null);
    } catch (e) {
      console.log('Error fetching queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const getMyPositionIndex = () => {
    if (!currentUserAppt) return null;
    return appointments.findIndex(a => a.id === currentUserAppt.id) + 1;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={120} style={{marginBottom: 16}} />
        <SkeletonLoader width="100%" height={60} style={{marginBottom: 8}} />
        <SkeletonLoader width="100%" height={60} style={{marginBottom: 8}} />
      </View>
    );
  }

  const myPos = getMyPositionIndex();
  const currentServing = appointments.find(a => a.status === 'in_consultation');
  const estWaitTime = myPos ? (myPos - 1) * 15 : 0; // 15 mins approx

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: theme.spacing[4], paddingTop: 60}}>
      
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Live Queue</Typography>
      </View>

      <Card style={[styles.mainCard, { backgroundColor: theme.colors.primary[500] }]}>
        <Typography variant="bodyLg" color="neutral.0" align="center">Your Position</Typography>
        <Typography variant="h1" color="neutral.0" align="center" style={{fontSize: 48, lineHeight: 56, marginVertical: 8}}>
          {myPos ? `#${myPos}` : '--'}
        </Typography>
        <Typography variant="caption" color="neutral.0" align="center">
          {myPos ? `Est. wait time: ~${estWaitTime} mins` : 'You do not have an active appointment right now.'}
        </Typography>
      </Card>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Typography variant="h3" color="neutral.900">{appointments.length}</Typography>
          <Typography variant="caption" color="neutral.700">Total Waiting</Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="h3" color="warning.500">{currentServing?.queue_order ? `#${currentServing.queue_order}` : '--'}</Typography>
          <Typography variant="caption" color="neutral.700">Now Serving</Typography>
        </View>
      </View>

      <Typography variant="h3" color="neutral.900" style={styles.listTitle}>Queue Flow</Typography>

      {appointments.map((appt, idx) => {
        const isMe = appt.patient_id === currentUserAppt?.patient_id;
        const isInConsultation = appt.status === 'in_consultation';
        
        return (
          <View key={appt.id} style={[styles.queueItem, isMe && styles.myQueueItem]}>
            <View style={[styles.posCircle, isInConsultation && {backgroundColor: theme.colors.warning[500]}]}>
              <Typography variant="bodyLg" color="neutral.0">{idx + 1}</Typography>
            </View>
            <View style={styles.queueInfo}>
              <Typography variant="bodyLg" color={isMe ? 'primary.500' : 'neutral.900'} style={{fontWeight: isMe ? 'bold' : 'normal'}}>
                {isMe ? 'You' : `Patient #${appt.queue_order}`}
              </Typography>
              <Typography variant="caption" color="neutral.700">{appt.time}</Typography>
            </View>
            <View>
              {isInConsultation && <Typography variant="caption" color="warning.500">Serving</Typography>}
            </View>
          </View>
        );
      })}

      {appointments.length === 0 && (
        <Typography variant="bodyLg" color="neutral.700" align="center" style={{marginTop: 32}}>
          Queue is empty.
        </Typography>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  title: {
    marginBottom: theme.spacing[6],
  },
  mainCard: {
    marginBottom: theme.spacing[4],
    alignItems: 'center',
    paddingVertical: theme.spacing[6],
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing[4],
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  listTitle: {
    marginBottom: theme.spacing[4],
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[2],
  },
  myQueueItem: {
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  posCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  queueInfo: {
    flex: 1,
  },
});
