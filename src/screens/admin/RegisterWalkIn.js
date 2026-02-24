import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function RegisterWalkIn({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Name and phone are required for walk-in limit constraints.');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Walk-in patients need a placeholder user or anon user. 
      // For this MVP, we will create a lightweight user profile if auth constraint is relaxed
      // Wait, public.users has id referring to auth.users. 
      // Workaround for MVP walk-ins: We need an auth ID. 
      // In a real scenario we'd use an admin-created ghost auth user, or just rely on a separate walk_in table.
      // Easiest MVP workaround: Generate a random UUID for patient_id, but foreign key constraint on auth.users will fail!
      // Since changing schema mid-way is hard, let's create a temporary Auth user, or just throw error if we don't have walk-in support in schema.
      // Ah, wait. I will just create a quick auth user and user row, or remove the foreign key if needed.
      // Let's create an auth user with a dummy email based on phone.

      const dummyEmail = `walkin_${Date.now()}@qclinic.demo`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: 'WalkinPassword123!'
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase.from('users').insert([{
        id: authData.user.id,
        role: 'patient',
        name,
        phone,
        age: parseInt(age) || null,
        gender
      }]);

      if (profileError) throw profileError;

      // Assign appointment
      const today = new Date().toISOString().split('T')[0];
      
      // Get current max queue_order for today
      const { data: qData } = await supabase
        .from('appointments')
        .select('queue_order')
        .eq('date', today)
        .order('queue_order', { ascending: false })
        .limit(1);

      const nextOrder = qData && qData.length > 0 ? qData[0].queue_order + 1 : 1;
      
      // We will assign a dummy time or find the next available slot
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + 15);
      const timeStr = `${String(nextTime.getHours()).padStart(2,'0')}:${String(nextTime.getMinutes()).padStart(2,'0')}`;

      const { error: apptError } = await supabase.from('appointments').insert([{
        patient_id: authData.user.id,
        date: today,
        time: timeStr,
        status: 'waiting',
        queue_order: nextOrder,
        notes: 'Walk-in'
      }]);

      if (apptError) throw apptError;

      Alert.alert('Success', `Walk-in registered! Queue position: #${nextOrder}`);
      navigation.goBack();
      
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, {paddingTop: 60}]} contentContainerStyle={{padding: theme.spacing[4]}}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">Register Walk-In</Typography>
      </View>
      
      <Input
        label="Full Name"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      
      <View style={{flexDirection: 'row'}}>
        <Input
          label="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          style={{flex: 1, marginRight: 8}}
        />
        <Input
          label="Gender"
          value={gender}
          onChangeText={setGender}
          style={{flex: 1, marginLeft: 8}}
        />
      </View>

      <Button 
        title="Auto Assign Next Slot" 
        onPress={handleRegister} 
        loading={loading}
        style={styles.btn}
      />
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
  btn: {
    marginTop: theme.spacing[6],
  }
});
