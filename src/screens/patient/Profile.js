import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function Profile({ navigation }) {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data || {});
    } catch (e) {
      console.log('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          phone: profile.phone,
          age: parseInt(profile.age) || null,
          gender: profile.gender
        })
        .eq('id', user.id);

      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {[1,2,3,4,5].map(i => <SkeletonLoader key={i} width="100%" height={48} style={{marginBottom: 16}} />)}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: theme.spacing[4], paddingTop: 60, paddingBottom: theme.spacing[10]}}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[6]}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </TouchableOpacity>
        <Typography variant="h2" color="neutral.900">My Profile</Typography>
      </View>
      
      <Input
        label="Full Name"
        value={profile.name || ''}
        onChangeText={(txt) => setProfile({...profile, name: txt})}
      />
      <Input
        label="Phone Number"
        value={profile.phone || ''}
        onChangeText={(txt) => setProfile({...profile, phone: txt})}
        keyboardType="phone-pad"
      />
      <Input
        label="Email address (Read-only)"
        value={profile.email || ''}
        editable={false}
      />
      <View style={styles.row}>
        <Input
          label="Age"
          value={profile.age ? String(profile.age) : ''}
          onChangeText={(txt) => setProfile({...profile, age: txt})}
          keyboardType="numeric"
          style={{flex: 1, marginRight: theme.spacing[2]}}
        />
        <Input
          label="Gender"
          value={profile.gender || ''}
          onChangeText={(txt) => setProfile({...profile, gender: txt})}
          style={{flex: 1, marginLeft: theme.spacing[2]}}
        />
      </View>

      <Button title="Save Changes" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      
      <Button title="Logout" variant="secondary" onPress={handleLogout} textStyle={{color: theme.colors.error[500]}} />

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
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
});
