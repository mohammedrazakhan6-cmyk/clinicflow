import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState('patient');

  const handleLogin = async () => {
    // Determine mock email based on selected role
    let mockEmail = 'patient@demo.com';
    if (role === 'doctor') mockEmail = 'doctor@demo.com';
    if (role === 'admin') mockEmail = 'admin@demo.com';

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ 
      email: mockEmail, 
      password: 'password123' 
    });
    setLoading(false);
    
    if (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h1" color="neutral.900" style={styles.title}>
        Welcome Back
      </Typography>
      
      <Typography variant="bodyLg" color="neutral.500" style={{ marginBottom: 32 }}>
        Select your role to explore the different interfaces of Qlinic.
      </Typography>

      {/* Role Selector */}
      <View style={styles.roleContainer}>
        <Typography variant="bodyMd" style={{marginBottom: 12, fontWeight: 'bold'}}>Role (Demo ONLY):</Typography>
        <View style={styles.roleButtonGroup}>
          {['patient', 'doctor', 'admin'].map((r) => (
            <Button
              key={r}
              title={r.charAt(0).toUpperCase() + r.slice(1)}
              variant={role === r ? 'primary' : 'secondary'}
              onPress={() => setRole(r)}
              style={styles.roleButton}
              textStyle={{fontSize: 14}}
            />
          ))}
        </View>
      </View>
      
      <Button 
        title="Login" 
        size="lg"
        onPress={handleLogin} 
        loading={loading}
        style={styles.button}
      />
      
      <Button 
        title="Don't have an account? Register" 
        variant="text"
        onPress={() => navigation.navigate('Register')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing[6],
    justifyContent: 'center',
  },
  title: {
    marginBottom: theme.spacing[2],
  },
  roleContainer: {
    marginBottom: theme.spacing[8],
  },
  roleButtonGroup: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  roleButton: {
    flex: 1,
    height: 48,
    paddingHorizontal: 0,
  },
  button: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
});
