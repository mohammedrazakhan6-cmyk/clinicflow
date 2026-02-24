import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { Card } from '../../components/Card';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { LogOut, Users, Settings, UserPlus, ListFilter, CalendarDays } from 'lucide-react-native';

export default function AdminDashboard({ navigation }) {
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0, avgWait: 0 });
  const [appointmentsPreview, setAppointmentsPreview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    const sub = supabase.channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchStats)
      .subscribe();
      
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('id, status, queue_order, time, users (name)')
        .eq('date', today)
        .order('queue_order', { ascending: true });
      
      if (data) {
        setStats({
          total: data.length,
          waiting: data.filter(a => a.status === 'waiting' || a.status === 'in_consultation').length,
          completed: data.filter(a => a.status === 'completed').length,
          avgWait: data.filter(a => a.status === 'waiting').length * 15 // Rough estimate based on queue
        });
        
        // Take up to 4 upcoming for the list preview
        const upcoming = data.filter(a => a.status === 'waiting' || a.status === 'in_consultation').slice(0, 4);
        setAppointmentsPreview(upcoming);
      }
    } catch (e) {
      console.log('Error fetching admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader width={150} height={32} style={{margin: 16}} />
        <View style={styles.grid}>
          {[1,2,3,4].map(i => <SkeletonLoader key={i} width="46%" height={100} style={{marginBottom: 16}} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{padding: theme.spacing[4]}}>
        
        <View style={styles.header}>
          <Typography variant="h2" color="neutral.900">Admin Dashboard</Typography>
          <View style={styles.dateBadge}>
            <CalendarDays color={theme.colors.neutral[700]} size={16} style={{marginRight: 6}} />
            <Typography variant="bodyMd" color="neutral.700" style={{fontWeight: '500'}}>Today</Typography>
          </View>
        </View>

        <View style={styles.grid}>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{marginBottom: 8}}>Total Patients</Typography>
            <Typography variant="h1" color="neutral.900">{stats.total}</Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{marginBottom: 8}}>Currently Waiting</Typography>
            <Typography variant="h1" color="neutral.900">{stats.waiting}</Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{marginBottom: 8}}>Completed</Typography>
            <Typography variant="h1" color="neutral.900">{stats.completed}</Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="bodyMd" color="neutral.700" style={{marginBottom: 8}}>Est. Wait Time</Typography>
            <Typography variant="h1" color="neutral.900">{stats.avgWait}m</Typography>
          </Card>
        </View>

        {/* List Section mimicking "Trending Items" */}
        <Card style={styles.listSection}>
          <View style={styles.listHeader}>
            <Typography variant="h3" color="neutral.900">Live Queue</Typography>
            <TouchableOpacity onPress={() => navigation.navigate('AdminAppointments')} style={styles.seeAllBtn}>
              <Typography variant="bodyMd" color="neutral.700" style={{fontWeight: '500'}}>See All</Typography>
            </TouchableOpacity>
          </View>

          {appointmentsPreview.map((appt, idx) => (
            <View key={appt.id} style={[styles.listItem, idx === appointmentsPreview.length - 1 && {borderBottomWidth: 0}]}>
              <View style={styles.listAvatar}>
                <Typography variant="bodyLg" color="primary.600" style={{fontWeight: 'bold'}}>
                  {appt.users?.name?.charAt(0) || 'P'}
                </Typography>
              </View>
              <View style={styles.listInfo}>
                <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: '600'}}>{appt.users?.name || 'Walk-in'}</Typography>
                <Typography variant="bodyMd" color="neutral.500">{appt.status === 'in_consultation' ? 'Consulting' : 'Waiting'}</Typography>
              </View>
              <View style={styles.listMetrics}>
                <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: '600', textAlign: 'right'}}>#{appt.queue_order}</Typography>
                <Typography variant="caption" color="primary.500" style={{fontWeight: 'bold', textAlign: 'right'}}>
                  {appt.time}
                </Typography>
              </View>
            </View>
          ))}
          
          {appointmentsPreview.length === 0 && (
            <Typography variant="bodyMd" color="neutral.500" style={{textAlign: 'center', marginVertical: 24}}>
              Queue is empty.
            </Typography>
          )}
        </Card>

        {/* Other Admin Actions */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing[4], marginBottom: theme.spacing[4]}}>
          <Typography variant="h3" color="neutral.900">Quick Actions</Typography>
          <TouchableOpacity onPress={handleLogout}>
             <Typography variant="bodyMd" color="error.500" style={{fontWeight: 'bold'}}>Log Out</Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('RegisterWalkIn')}>
            <View style={styles.actionIconWrap}>
              <UserPlus color={theme.colors.primary[500]} size={24} />
            </View>
            <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: 'bold'}}>Register{'\n'}Walk-in</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AdjustQueue')}>
            <View style={styles.actionIconWrap}>
              <ListFilter color={theme.colors.accent[500]} size={24} />
            </View>
            <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: 'bold'}}>Adjust{'\n'}Queue</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ManageSchedule')}>
            <View style={styles.actionIconWrap}>
              <Settings color={theme.colors.primary[500]} size={24} />
            </View>
            <Typography variant="bodyLg" color="neutral.900" style={{fontWeight: 'bold'}}>Doctor{'\n'}Settings</Typography>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    marginBottom: theme.spacing[6],
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    ...theme.shadow.card,
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
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  actionItem: {
    width: '47%',
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 24,
    padding: 20,
    height: 140,
    justifyContent: 'flex-end',
    ...theme.shadow.card,
  },
  actionIconWrap: {
    position: 'absolute',
    top: 20,
    right: 20,
  }
});
