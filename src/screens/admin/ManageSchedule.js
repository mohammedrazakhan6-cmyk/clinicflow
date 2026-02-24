import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';
import { AdminBottomNav } from '../../components/AdminBottomNav';

export default function ManageSchedule({ navigation }) {
  const [settings, setSettings] = useState({
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: '30',
    max_patients: '20',
    is_available: true
  });
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('doc-1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings(selectedDoctor);
  }, [selectedDoctor]);

  const fetchSettings = async (doctorId) => {
    if (doctors.length === 0) {
      const { data: docs } = await supabase.from('doctors').select('*');
      if (docs) {
        setDoctors(docs);
        if (!doctorId && docs.length > 0) {
          setSelectedDoctor(docs[0].id);
          doctorId = docs[0].id;
        }
      }
    }

    if (!doctorId) return;

    let { data } = await supabase.from('doctor_settings').select('*');
    // Using simple array filter for mock since real DB would .eq('doctor_id', doctorId) 
    // but our mock `from('doctor_settings')` just returns all.
    if (data && Array.isArray(data)) {
      data = data.find(s => s.doctor_id === doctorId);
    }
    
    if (data) {
      setSettings({
        start_time: data.start_time.substring(0, 5), // 'HH:mm'
        end_time: data.end_time.substring(0, 5),
        slot_duration: String(data.slot_duration),
        max_patients: String(data.max_patients || 20),
        is_available: data.is_available
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('doctor_settings').upsert({
        doctor_id: selectedDoctor,
        start_time: settings.start_time,
        end_time: settings.end_time,
        slot_duration: parseInt(settings.slot_duration),
        max_patients: parseInt(settings.max_patients),
        is_available: settings.is_available
      });

      if (error) throw error;
      Alert.alert('Success', 'Settings updated successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.neutral[50]}}>
    <ScrollView style={[styles.container, {paddingTop: 60}]} contentContainerStyle={{padding: theme.spacing[4], paddingBottom: 100}}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[4]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Schedule Settings</Typography>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={{paddingRight: theme.spacing[4]}}>
        {doctors.map(doc => (
          <TouchableOpacity 
            key={doc.id}
            style={[styles.tab, selectedDoctor === doc.id && styles.tabActive]}
            onPress={() => setSelectedDoctor(doc.id)}
          >
            <Typography variant="bodyMd" color={selectedDoctor === doc.id ? 'neutral.0' : 'neutral.700'} style={{fontWeight: '600'}}>
              {doc.name}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Card style={styles.card}>
        <View style={styles.toggleRow}>
          <Typography variant="bodyLg" color="neutral.900">Doctor Available Today</Typography>
          <Switch 
            value={settings.is_available} 
            onValueChange={(v) => setSettings({...settings, is_available: v})}
            trackColor={{ false: theme.colors.neutral[100], true: theme.colors.success[500] }}
          />
        </View>
      </Card>

      <View style={styles.row}>
        <Input
          label="Start Time (HH:mm)"
          value={settings.start_time}
          onChangeText={(v) => setSettings({...settings, start_time: v})}
          style={{flex: 1, marginRight: 8}}
        />
        <Input
          label="End Time (HH:mm)"
          value={settings.end_time}
          onChangeText={(v) => setSettings({...settings, end_time: v})}
          style={{flex: 1, marginLeft: 8}}
        />
      </View>

      <View style={styles.row}>
        <Input
          label="Slot Duration (mins)"
          value={settings.slot_duration}
          onChangeText={(v) => setSettings({...settings, slot_duration: v})}
          keyboardType="numeric"
          style={{flex: 1, marginRight: 8}}
        />
        <Input
          label="Max Patients/Day"
          value={settings.max_patients}
          onChangeText={(v) => setSettings({...settings, max_patients: v})}
          keyboardType="numeric"
          style={{flex: 1, marginLeft: 8}}
        />
      </View>

      <Button title="Save Settings" onPress={handleSave} loading={saving} style={styles.btn} />
    </ScrollView>
    <AdminBottomNav navigation={navigation} activeRoute="ManageSchedule" />
    </View>
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
    marginBottom: theme.spacing[6],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
  },
  btn: {
    marginTop: theme.spacing[4],
  }
});
