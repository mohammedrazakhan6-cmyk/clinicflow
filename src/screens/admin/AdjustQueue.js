import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react-native';

export default function AdjustQueue({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    // For simplicity, omitting realtime subscription here to prevent shifting while adjusting
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select(`id, queue_order, status, time, users (name)`)
        .eq('date', today)
        .in('status', ['waiting', 'in_consultation'])
        .order('queue_order', { ascending: true });
      
      setAppointments(data || []);
    } catch (e) {
      console.log('Error fetching queue:', e);
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

          // Optimistic UI update
          const newArr = [...appointments];
          newArr[index1] = { ...appt1, queue_order: appt2.queue_order };
          newArr[index2] = { ...appt2, queue_order: appt1.queue_order };
          newArr.sort((a, b) => a.queue_order - b.queue_order);
          setAppointments(newArr);

          // DB update
          await supabase.rpc('swap_queue_order', {
            id1: appt1.id,
            order1: appt2.queue_order,
            id2: appt2.id,
            order2: appt1.queue_order
          });
          
          // NOTE: Supabase might need an RPC for atomic swap, or we just do two sequential updates.
          // Since RPC 'swap_queue_order' is not created, let's do two sequential updates.
          await supabase.from('appointments').update({ queue_order: appt2.queue_order }).eq('id', appt1.id);
          await supabase.from('appointments').update({ queue_order: appt1.queue_order }).eq('id', appt2.id);
          
          fetchQueue();
        } 
      }
    ]);
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.card}>
      <View style={styles.info}>
        <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: 'bold'}}>
          #{item.queue_order} - {item.users?.name}
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
        {[1,2,3].map(i => <SkeletonLoader key={i} width="100%" height={80} style={{marginBottom: 16}} />)}
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: 60}]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Adjust Queue</Typography>
      </View>
      <FlatList
        data={appointments}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 20}}
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
