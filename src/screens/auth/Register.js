import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const handleRegister = async () => {
    if (!name || !phone || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      setLoading(false);
      Alert.alert('Registration Failed', authError.message);
      return;
    }

    // Create user profile in public.users
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            name,
            phone,
            email,
            role: 'patient'
          }
        ]);

      if (profileError) {
        Alert.alert('Profile Creation Failed', profileError.message);
      } else {
        Alert.alert('Success', 'Registration successful! You can now log in.');
      }
    }

    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h1" color="neutral.900" style={styles.title}>
        Create Account
      </Typography>

      <Input
        label="Full Name"
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      <Input
        label="Phone Number"
        placeholder="Enter your phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title="Register"
        size="lg"
        onPress={handleRegister}
        loading={loading}
        style={styles.button}
      />

      <Button
        title="Already have an account? Login"
        variant="text"
        onPress={() => navigation.navigate('Login')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing[6],
    justifyContent: 'center',
  },
  title: {
    marginBottom: theme.spacing[8],
  },
  roleContainer: {
    marginBottom: theme.spacing[4],
  },
  roleButtonGroup: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  roleButton: {
    flex: 1,
    height: 36,
    paddingHorizontal: 0,
  },
  button: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
});
