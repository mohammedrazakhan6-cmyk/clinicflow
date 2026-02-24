import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';
import { StatusPill } from '../../components/StatusPill';

export default function DailyAppointments({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchDaily();

      const sub = supabase.channel('public:appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchDaily)
        .subscribe();

      return () => supabase.removeChannel(sub);
    }, [])
  );

  const fetchDaily = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select(`
          id, date, time, status, queue_order,
          users (id, name, phone)
        `)
        .eq('date', today)
        .order('time', { ascending: true });
      
      setAppointments(data || []);
    } catch (e) {
      console.log('Error fetching daily appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setLoading(true);
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) Alert.alert('Error', error.message);
    setLoading(false); // will re-fetch via realtime anyway but good for instant feedback
  };

  const handleAction = (appt, action) => {
    Alert.alert(`Confirm Action`, `Mark appointment as ${action.replace('_', ' ')}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(appt.id, action) }
    ]);
  };

  const renderItem = ({ item }) => {
    const isWaiting = item.status === 'waiting';
    const isInConsultation = item.status === 'in_consultation';
    const isCompleted = item.status === 'completed';

    return (
      <Card style={[styles.card, isInConsultation && styles.activeCard]}>
        <View style={styles.header}>
          <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: 'bold'}}>
            {item.time} - {item.users?.name || 'Unknown Patient'}
          </Typography>
          <StatusPill status={item.status} />
        </View>

        <Typography variant="bodyMd" color="neutral.700" style={{marginBottom: 12}}>
          Queue #{item.queue_order} | Phone: {item.users?.phone || 'N/A'}
        </Typography>

        <View style={styles.actions}>
          <Button 
            title="Details" 
            variant="secondary" 
            size="md" 
            style={styles.btnSm} 
            textStyle={{fontSize: 14}}
            onPress={() => navigation.navigate('PatientDetails', { patientId: item.users.id, appointmentId: item.id })}
          />
          
          {isWaiting && (
            <Button 
              title="Start" 
              size="md" 
              style={styles.btnSm}
              textStyle={{fontSize: 14}}
              onPress={() => handleAction(item, 'in_consultation')} 
            />
          )}

          {isInConsultation && (
            <Button 
              title="Complete" 
              size="md" 
              style={[styles.btnSm, {backgroundColor: theme.colors.success[500]}]}
              textStyle={{fontSize: 14}}
              onPress={() => handleAction(item, 'completed')} 
            />
          )}

          {isWaiting && (
            <Button 
              title="No Show" 
              variant="text" 
              size="md" 
              style={styles.btnSm}
              textStyle={{fontSize: 14, color: theme.colors.error[500]}}
              onPress={() => handleAction(item, 'no_show')} 
            />
          )}
        </View>
      </Card>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <View style={styles.container}>
        {[1,2,3].map(i => <SkeletonLoader key={i} width="100%" height={140} style={{marginBottom: 16}} />)}
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: 60}]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Daily Appointments</Typography>
      </View>
      <FlatList
        data={appointments}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 20}}
        ListEmptyComponent={
          <Typography variant="bodyLg" color="neutral.700" align="center" style={{marginTop: 40}}>
            No appointments scheduled for today.
          </Typography>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing[4],
  },
  title: {
    marginBottom: theme.spacing[6],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  activeCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  btnSm: {
    height: 36,
    paddingHorizontal: theme.spacing[3],
    flexGrow: 0,
  }
});
