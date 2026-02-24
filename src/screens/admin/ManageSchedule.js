import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function ManageSchedule({ navigation }) {
  const [settings, setSettings] = useState({
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: '30',
    max_patients: '20',
    is_available: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('doctor_settings').select('*').limit(1).single();
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
        id: 1, // hardcoded for single doctor MVP
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
    <ScrollView style={[styles.container, {paddingTop: 60}]} contentContainerStyle={{padding: theme.spacing[4]}}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Schedule Settings</Typography>
      </View>

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
