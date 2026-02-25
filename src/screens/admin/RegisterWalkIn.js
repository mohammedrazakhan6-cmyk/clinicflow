import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';
import { AdminBottomNav } from '../../components/AdminBottomNav';

export default function RegisterWalkIn({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [errors, setErrors] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'doctor');

    if (data) {
      setDoctors(data);
      if (data.length > 0) setSelectedDoctor(data[0].id);
    }
  };

  const handleRegister = async () => {
    let valid = true;
    let newErrors = {};

    if (!name.trim()) { newErrors.name = 'Full name is required'; valid = false; }
    if (!phone.trim() || phone.length < 10) { newErrors.phone = 'Valid phone number is required'; valid = false; }
    if (!age || isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120) { newErrors.age = 'Valid age required'; valid = false; }
    if (!gender) { newErrors.gender = 'Gender is required'; valid = false; }
    if (!selectedDoctor) { newErrors.doctor = 'Doctor selection is required'; valid = false; }

    setErrors(newErrors);

    if (!valid) {
      Alert.alert('Validation Error', 'Please check the form for errors and try again.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create walk-in record (No Auth user created)
      const { data: walkInData, error: walkInError } = await supabase
        .from('walk_ins')
        .insert([{
          name,
          phone,
          age: parseInt(age) || null,
          gender,
          doctor_id: selectedDoctor
        }])
        .select()
        .single();

      if (walkInError) throw walkInError;

      // 2. Assign appointment
      const today = new Date().toISOString().split('T')[0];

      // Get current max queue_order for today FOR THIS DOCTOR specifically
      const { data: qData } = await supabase
        .from('appointments')
        .select('queue_order')
        .eq('date', today)
        .eq('doctor_id', selectedDoctor)
        .order('queue_order', { ascending: false })
        .limit(1);

      const nextOrder = qData && qData.length > 0 ? qData[0].queue_order + 1 : 1;

      // Auto-assign time (current + 15m buffer)
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + 15);
      const timeStr = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`;

      const { error: apptError } = await supabase.from('appointments').insert([{
        walk_in_id: walkInData.id,
        doctor_id: selectedDoctor,
        date: today,
        time: timeStr,
        status: 'waiting',
        queue_order: nextOrder,
        token: nextOrder,
        notes: 'Walk-in Registration'
      }]);

      if (apptError) throw apptError;

      Alert.alert('Success', `Walk-in registered! Queue position: #${nextOrder}`);

      // Reset form and go back
      setName(''); setPhone(''); setAge(''); setGender(''); setErrors({});
      navigation.goBack();

    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.neutral[50] }}>
      <ScrollView style={[styles.container, { paddingTop: 60 }]} contentContainerStyle={{ padding: theme.spacing[4], paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[4] }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <ArrowLeft size={24} color={theme.colors.neutral[900]} />
          </TouchableOpacity>
          <Typography variant="h2" color="neutral.900">Register Walk-In</Typography>
        </View>

        <Typography variant="bodyMd" color="neutral.700" style={{ marginBottom: 8, fontWeight: 'bold' }}>Select Doctor</Typography>
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

        <Input
          label="Full Name"
          value={name}
          onChangeText={(text) => { setName(text); setErrors(e => ({ ...e, name: null })); }}
          placeholder="First and Last Name"
          error={errors.name}
        />
        <Input
          label="Phone Number"
          value={phone}
          onChangeText={(text) => { setPhone(text); setErrors(e => ({ ...e, phone: null })); }}
          keyboardType="phone-pad"
          placeholder="+91 98765 43210"
          error={errors.phone}
        />

        <View style={{ flexDirection: 'Otherrow', marginBottom: theme.spacing[4] }}>
          <Input
            label="Age"
            value={age}
            onChangeText={(text) => { setAge(text); setErrors(e => ({ ...e, age: null })); }}
            keyboardType="numeric"
            placeholder="e.g. 34"
            error={errors.age}
            style={{ flex: 1, marginRight: 8, marginBottom: 0 }}
          />

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Typography variant="bodyMd" color="neutral.900" style={{ marginBottom: theme.spacing[2] }}>Gender</Typography>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {['Male', 'Female'].map(g => (
                <TouchableOpacity
                  key={g}
                  onPress={() => { setGender(g); setErrors(e => ({ ...e, gender: null })); }}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                >
                  <Typography variant="caption" color={gender === g ? 'neutral.0' : 'neutral.700'} style={{ fontWeight: '600' }}>
                    {g === '' ? 'Oth.' : g}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && (
              <Typography variant="caption" color="error.500" style={{ marginTop: 4 }}>{errors.gender}</Typography>
            )}
          </View>
        </View>

        <Button
          title="Auto Assign Next Slot"
          onPress={handleRegister}
          loading={loading}
          style={styles.btn}
        />
      </ScrollView>
      <AdminBottomNav navigation={navigation} activeRoute="RegisterWalkIn" />
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
  genderBtn: {
    flex: 1,
    height: 56,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  genderBtnActive: {
    backgroundColor: theme.colors.primary[500],
  },
  btn: {
    marginTop: theme.spacing[2],
  }
});
