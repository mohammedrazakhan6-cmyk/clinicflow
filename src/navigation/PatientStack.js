import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PatientHome from '../screens/patient/PatientHome';
import BookAppointment from '../screens/patient/BookAppointment';
import DoctorList from '../screens/patient/DoctorList';
import Queue from '../screens/patient/Queue';
import VisitHistory from '../screens/patient/VisitHistory';
import Profile from '../screens/patient/Profile';

const Stack = createNativeStackNavigator();

export default function PatientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientHome" component={PatientHome} />
      <Stack.Screen name="DoctorList" component={DoctorList} />
      <Stack.Screen name="BookAppointment" component={BookAppointment} />
      <Stack.Screen name="Queue" component={Queue} />
      <Stack.Screen name="VisitHistory" component={VisitHistory} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}
