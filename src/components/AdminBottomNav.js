import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { LayoutGrid, UserPlus, ListFilter, Settings, User } from 'lucide-react-native';

export const AdminBottomNav = ({ navigation, activeRoute }) => {
  return (
    <View style={styles.floatingNavContainer}>
      <View style={styles.floatingNav}>
        <TouchableOpacity 
          style={[styles.navBtn, activeRoute === 'AdminDashboard' && styles.navBtnActive]}
          onPress={() => activeRoute !== 'AdminDashboard' && navigation.navigate('AdminDashboard')}
        >
          <LayoutGrid size={22} color={activeRoute === 'AdminDashboard' ? theme.colors.neutral[900] : theme.colors.neutral[400]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navBtn, activeRoute === 'RegisterWalkIn' && styles.navBtnActive]}
          onPress={() => activeRoute !== 'RegisterWalkIn' && navigation.navigate('RegisterWalkIn')}
        >
          <UserPlus size={22} color={activeRoute === 'RegisterWalkIn' ? theme.colors.neutral[900] : theme.colors.neutral[400]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navBtn, activeRoute === 'AdjustQueue' && styles.navBtnActive]}
          onPress={() => activeRoute !== 'AdjustQueue' && navigation.navigate('AdjustQueue')}
        >
          <ListFilter size={22} color={activeRoute === 'AdjustQueue' ? theme.colors.neutral[900] : theme.colors.neutral[400]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navBtn, activeRoute === 'ManageSchedule' && styles.navBtnActive]}
          onPress={() => activeRoute !== 'ManageSchedule' && navigation.navigate('ManageSchedule')}
        >
          <Settings size={22} color={activeRoute === 'ManageSchedule' ? theme.colors.neutral[900] : theme.colors.neutral[400]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navBtn, activeRoute === 'AdminProfile' && styles.navBtnActive]}
          onPress={() => activeRoute !== 'AdminProfile' && navigation.navigate('AdminProfile')}
        >
          <User size={22} color={activeRoute === 'AdminProfile' ? theme.colors.neutral[900] : theme.colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 16,
    ...theme.shadow.card,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnActive: {
    backgroundColor: theme.colors.neutral[0],
    ...theme.shadow.card,
  }
});
