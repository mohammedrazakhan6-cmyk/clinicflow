import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DoctorHome from '../screens/doctor/DoctorHome';
import DailyAppointments from '../screens/doctor/DailyAppointments';
import PatientDetails from '../screens/doctor/PatientDetails';

const Stack = createNativeStackNavigator();

export default function DoctorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorHome" component={DoctorHome} />
      <Stack.Screen name="DailyAppointments" component={DailyAppointments} />
      <Stack.Screen name="PatientDetails" component={PatientDetails} />
    </Stack.Navigator>
  );
}
