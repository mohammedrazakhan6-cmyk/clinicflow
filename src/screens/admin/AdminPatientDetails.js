// Creating this file as AdminPatientDetails.js based on PatientDetails.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function AdminPatientDetails({ route, navigation }) {
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

  const handleCancelAppointment = async () => {
    if (!appointmentId) return;
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
          setSaving(false);
          
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            Alert.alert('Success', 'Appointment cancelled');
            navigation.goBack();
          }
        }
      }
    ]);
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
      <View style={styles.notesContainer}>
        <Typography variant="bodyLg" color="neutral.700">
          {notes || 'No notes added yet.'}
        </Typography>
      </View>

      <Button 
        title="Cancel Appointment" 
        variant="secondary"
        onPress={handleCancelAppointment} 
        loading={saving} 
        style={{marginTop: 24, borderColor: theme.colors.error[500]}}
        textStyle={{color: theme.colors.error[500]}}
      />
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
  },
  notesContainer: {
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    minHeight: 100,
  }
});
