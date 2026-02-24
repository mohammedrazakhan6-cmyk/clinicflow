import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import RegisterWalkIn from '../screens/admin/RegisterWalkIn';
import ManageSchedule from '../screens/admin/ManageSchedule';
import AdjustQueue from '../screens/admin/AdjustQueue';
import AdminAppointments from '../screens/admin/AdminAppointments';
import AdminPatientDetails from '../screens/admin/AdminPatientDetails';
import AdminProfile from '../screens/admin/AdminProfile';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="RegisterWalkIn" component={RegisterWalkIn} />
      <Stack.Screen name="ManageSchedule" component={ManageSchedule} />
      <Stack.Screen name="AdjustQueue" component={AdjustQueue} />
      <Stack.Screen name="AdminAppointments" component={AdminAppointments} />
      <Stack.Screen name="AdminPatientDetails" component={AdminPatientDetails} />
      <Stack.Screen name="AdminProfile" component={AdminProfile} />
    </Stack.Navigator>
  );
}
