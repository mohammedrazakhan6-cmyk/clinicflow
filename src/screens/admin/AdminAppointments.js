import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react-native';

export default function AdminAppointments({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select(`id, patient_id, status, time, queue_order, users (name, phone)`)
        .eq('date', today)
        .order('time', { ascending: true });
      
      setAppointments(data || []);
    } catch (e) {
      console.log('Error fetching appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id, currentOrder) => {
    Alert.alert('Check In', 'Mark patient as Waiting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          // In a real app, we'd assign the next available queue order here if they don't have one
          const { error } = await supabase
            .from('appointments')
            .update({ status: 'waiting' })
            .eq('id', id);
          
          if (!error) fetchAppointments();
        }
      }
    ]);
  };

  const handleCancel = async (id) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', id);
          
          if (!error) fetchAppointments();
        }
      }
    ]);
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'waiting': return { color: theme.colors.warning[500], text: 'Waiting In Clinic' };
      case 'in_consultation': return { color: theme.colors.primary[500], text: 'In Consultation' };
      case 'completed': return { color: theme.colors.success[500], text: 'Completed' };
      case 'cancelled': return { color: theme.colors.error[500], text: 'Cancelled' };
      default: return { color: theme.colors.neutral[500], text: 'Booked' };
    }
  };

  const renderItem = ({ item }) => {
    const statusInfo = renderStatus(item.status);
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AdminPatientDetails', { patientId: item.patient_id, appointmentId: item.id })}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Typography variant="h3" color="neutral.900" style={{marginBottom: 4}}>
                {item.users?.name || 'Unknown Patient'}
              </Typography>
              <Typography variant="bodyMd" color="neutral.500">
                {item.users?.phone || 'No phone'}
              </Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant="h3" color="primary.500" style={{marginBottom: 4}}>
                {item.time}
              </Typography>
              <Typography variant="caption" color={statusInfo.color} style={{ fontWeight: 'bold' }}>
                {statusInfo.text}
              </Typography>
            </View>
          </View>

          {item.status !== 'completed' && item.status !== 'cancelled' && (
            <View style={styles.actionRow}>
              {item.status === 'booked' && (
                <Button 
                  title="Check In" 
                  size="md" 
                  style={{flex: 1, marginRight: 8}} 
                  onPress={() => handleCheckIn(item.id, item.queue_order)}
                />
              )}
              {item.status === 'waiting' && (
                <View style={{flex: 1, marginRight: 8, justifyContent: 'center', backgroundColor: theme.colors.warning[50], borderRadius: theme.radius.md, padding: 8}}>
                  <Typography variant="caption" color="warning.600" align="center" style={{fontWeight: 'bold'}}>
                    Queue #{item.queue_order}
                  </Typography>
                </View>
              )}
              <Button 
                title="Cancel" 
                variant="secondary" 
                size="md" 
                style={{flex: 1, marginLeft: 8, borderColor: theme.colors.error[500]}} 
                textStyle={{color: theme.colors.error[500]}}
                onPress={() => handleCancel(item.id)}
              />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <View style={[styles.container, {paddingTop: 60}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
            <ArrowLeft size={24} color={theme.colors.neutral[900]} style={{marginRight: 16}} />
            <Typography variant="h2" color="neutral.900">Today's Appointments</Typography>
        </View>
        {[1,2,3].map(i => <SkeletonLoader key={i} width="100%" height={120} style={{marginBottom: 16}} />)}
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
          <View style={styles.empty}>
            <Clock size={48} color={theme.colors.neutral[300]} style={{marginBottom: 16}} />
            <Typography variant="bodyLg" color="neutral.500">No appointments scheduled for today.</Typography>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[4],
  },
  card: {
    marginBottom: theme.spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[4],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  }
});
