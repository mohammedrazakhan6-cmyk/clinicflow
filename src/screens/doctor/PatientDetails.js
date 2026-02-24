import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function PatientDetails({ route, navigation }) {
  const { patientId, appointmentId } = route.params;
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: userData } = await supabase.from('users').select('*').eq('id', patientId).single();
    if (userData) setPatient(userData);

    if (appointmentId) {
      const { data: apptData } = await supabase.from('appointments').select('notes').eq('id', appointmentId).single();
      if (apptData?.notes) setNotes(apptData.notes);
    }
  };

  const handleSaveNotes = async () => {
    if (!appointmentId) return;
    setSaving(true);
    const { error } = await supabase.from('appointments').update({ notes }).eq('id', appointmentId);
    setSaving(false);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Notes saved successfully');
      navigation.goBack();
    }
  };

  if (!patient) return null;

  return (
    <ScrollView style={[styles.container, {paddingTop: 60}]} contentContainerStyle={{padding: theme.spacing[4]}}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Patient Details</Typography>
      </View>

      <View style={styles.infoGroup}>
        <Typography variant="caption" color="neutral.700">Name</Typography>
        <Typography variant="bodyLg" color="neutral.900">{patient.name}</Typography>
      </View>
      <View style={styles.infoGroup}>
        <Typography variant="caption" color="neutral.700">Phone</Typography>
        <Typography variant="bodyLg" color="neutral.900">{patient.phone || 'N/A'}</Typography>
      </View>
      <View style={styles.infoGroup}>
        <Typography variant="caption" color="neutral.700">Age / Gender</Typography>
        <Typography variant="bodyLg" color="neutral.900">{patient.age || '--'} / {patient.gender || '--'}</Typography>
      </View>

      <Typography variant="h3" color="neutral.900" style={[styles.title, {marginTop: 24}]}>Current Visit Notes</Typography>
      <Input
        placeholder="Enter consultation notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={6}
        inputStyle={{height: 120, textAlignVertical: 'top', paddingTop: 12}}
        style={{height: 120, marginBottom: 24}}
      />

      <Button title="Save Notes & Back" onPress={handleSaveNotes} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[0],
  },
  title: {
    marginBottom: theme.spacing[6],
  },
  infoGroup: {
    marginBottom: theme.spacing[4],
  }
});
