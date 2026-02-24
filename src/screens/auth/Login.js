import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { Building2, Stethoscope, User } from 'lucide-react-native';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('patient');

  const ROLE_CONFIG = [
    { id: 'patient', label: 'Patient', icon: User, color: theme.colors.primary[500] },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: theme.colors.accent[500] },
    { id: 'admin', label: 'Admin', icon: Building2, color: theme.colors.warning[500] },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Validate user role
      if (authData?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (userError) throw userError;

        if (userData.role !== selectedRole) {
          // Role mismatch: sign out immediately
          await supabase.auth.signOut();
          throw new Error(`Selected role (${selectedRole}) does not match your account role (${userData.role})`);
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h1" color="neutral.900" style={styles.title}>
        Welcome Back
      </Typography>
      <Typography variant="bodyMd" color="neutral.500" style={{ marginBottom: 32 }}>
        Select your role and log in to your account
      </Typography>

      <View style={styles.roleContainer}>
        {ROLE_CONFIG.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              activeOpacity={0.7}
              style={[
                styles.roleCard,
                isSelected && { borderColor: role.color, backgroundColor: `${role.color}10` }
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: isSelected ? role.color : theme.colors.neutral[100] }]}>
                <Icon size={20} color={isSelected ? '#fff' : theme.colors.neutral[500]} />
              </View>
              <Typography
                variant="bodyMd"
                style={{ fontWeight: '600', color: isSelected ? theme.colors.neutral[900] : theme.colors.neutral[500] }}
              >
                {role.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      <Input
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

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
    marginBottom: theme.spacing[1],
  },
  roleContainer: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[8],
  },
  roleCard: {
    flex: 1,
    padding: theme.spacing[4],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: theme.spacing[2],
    ...theme.shadow.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  button: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
});
