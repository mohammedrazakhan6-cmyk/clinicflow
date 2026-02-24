import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react-native';

export default function VisitHistory({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['completed', 'cancelled', 'no_show'])
        .order('date', { ascending: false });

      setHistory(data || []);
    } catch (e) {
      console.log('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle color={theme.colors.success[500]} size={20} />;
      case 'cancelled': 
      case 'no_show': return <XCircle color={theme.colors.error[500]} size={20} />;
      default: return null;
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          {getStatusIcon(item.status)}
          <Typography variant="caption" style={{marginLeft: 8, textTransform: 'capitalize'}}>
            {item.status.replace('_', ' ')}
          </Typography>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar color={theme.colors.neutral[700]} size={16} />
          <Typography variant="bodyMd" color="neutral.900" style={{marginLeft: 8}}>{item.date}</Typography>
        </View>
        <View style={styles.detailRow}>
          <Clock color={theme.colors.neutral[700]} size={16} />
          <Typography variant="bodyMd" color="neutral.900" style={{marginLeft: 8}}>{item.time}</Typography>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notes}>
          <Typography variant="caption" color="neutral.700">Notes:</Typography>
          <Typography variant="bodyMd" color="neutral.900">{item.notes}</Typography>
        </View>
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
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
        <Typography variant="h2" color="neutral.900">Visit History</Typography>
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 20}}
        ListEmptyComponent={
          <Typography variant="bodyLg" color="neutral.700" align="center" style={{marginTop: 40}}>
            No past visits found.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    flexDirection: 'row',
    gap: theme.spacing[6],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notes: {
    marginTop: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
});
