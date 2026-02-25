import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react-native';
import { AdminBottomNav } from '../../components/AdminBottomNav';

export default function AdjustQueue({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [loading, setLoading] = useState(true);


  console.log("Selected Doctor:", selectedDoctor);

  useFocusEffect(
    useCallback(() => {
      fetchQueue(selectedDoctor);
    }, [selectedDoctor])
  );

  const fetchQueue = async (doctorId) => {
    setLoading(true);
    try {
      if (doctors.length === 0) {
        const { data: docs } = await supabase.from('users').select('*').eq('role', 'doctor');
        if (docs) {
          setDoctors(docs);
          if (!doctorId && docs.length > 0) {
            setSelectedDoctor(docs[0].id);
            doctorId = docs[0].id;
          }
        }
      }

      if (!doctorId) return;


      const today = new Date().toLocaleDateString('en-CA');
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, 
          queue_order, 
          status, 
          time, 
          doctor_id, 
          patient_id,
          walk_in_id,
          users!appointments_patient_id_fkey (name),
          walk_ins (name)
        `)
        .eq('date', today)
        .eq('doctor_id', doctorId) // Server-side filter
        .in('status', ['waiting', 'in_consultation'])
        .order('queue_order', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (e) {
      console.error('Error fetching queue:', e);
      Alert.alert('Error', 'Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  const swapOrder = async (index1, index2) => {
    if (index1 < 0 || index2 < 0 || index1 >= appointments.length || index2 >= appointments.length) return;

    Alert.alert('Confirm', 'Move this patient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          const appt1 = appointments[index1];
          const appt2 = appointments[index2];

          try {
            // Step 1: temporary value
            await supabase
              .from('appointments')
              .update({ queue_order: -1 })
              .eq('id', appt1.id);

            // Step 2: swap
            await supabase
              .from('appointments')
              .update({ queue_order: appt1.queue_order })
              .eq('id', appt2.id);

            await supabase
              .from('appointments')
              .update({ queue_order: appt2.queue_order })
              .eq('id', appt1.id);

            fetchQueue(selectedDoctor);
          } catch (e) {
            console.log("Swap error:", e);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.card}>
      <View style={styles.info}>
        <Typography variant="bodyLg" color="neutral.900" style={{ fontWeight: 'bold' }}>
          {/* #{item.queue_order} - {item.users?.name} */}
          #{item.queue_order} - {item.users?.name || item.walk_ins?.name || 'Unknown'}
        </Typography>
        <Typography variant="caption" color="neutral.700">Time: {item.time}</Typography>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => swapOrder(index, index - 1)}
          disabled={index === 0}
        >
          <ArrowUp color={index === 0 ? theme.colors.neutral[100] : theme.colors.primary[500]} size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => swapOrder(index, index + 1)}
          disabled={index === appointments.length - 1}
        >
          <ArrowDown color={index === appointments.length - 1 ? theme.colors.neutral[100] : theme.colors.primary[500]} size={24} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading && appointments.length === 0) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map(i => <SkeletonLoader key={i} width="100%" height={80} style={{ marginBottom: 16 }} />)}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[4] }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Adjust Queue</Typography>
      </View>

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
      </ScrollView>

      {appointments.length === 0 && !loading && (
        <Typography variant="bodyMd" color="neutral.500" style={{ textAlign: 'center', marginTop: 40 }}>
          No queue for this doctor.
        </Typography>
      )}
      <FlatList
        data={appointments}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <AdminBottomNav navigation={navigation} activeRoute="AdjustQueue" />
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[6],
    maxHeight: 40,
    minHeight: 40,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
    padding: theme.spacing[3],
  },
  info: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  iconBtn: {
    padding: theme.spacing[2],
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.radius.md,
  }
});
