import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../api/supabase';
import { theme } from '../styles/theme';

import AuthStack from './AuthStack';
import PatientStack from './PatientStack';
import DoctorStack from './DoctorStack';
import AdminStack from './AdminStack';

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)

      if (data.session) {
        fetchRole(data.session.user.id)
      } else {
        setIsLoading(false)
      }
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)

        if (session) {
          fetchRole(session.user.id)
        } else {
          setRole(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setRole(data.role);
      } else {
        setRole('patient'); // fallback
      }
    } catch (e) {
      console.log('Error fetching role', e);
      setRole('patient');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthStack />
      ) : role === 'doctor' ? (
        <DoctorStack />
      ) : role === 'admin' ? (
        <AdminStack />
      ) : (
        <PatientStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
  },
});
