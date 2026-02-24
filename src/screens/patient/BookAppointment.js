import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/Typography';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft, Phone, MessageCircle, Star, Calendar, Users, ChevronRight } from 'lucide-react-native';

const generateTimeSlots = (start, end, durationMins) => {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  
  while (h < eh || (h === eh && m < em)) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    slots.push(`${String(displayH).padStart(2, '0')}.${String(m).padStart(2, '0')} ${period}`);
    
    m += durationMins;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }
  return slots;
};

export default function BookAppointment({ route, navigation }) {
  const doctorId = route.params?.doctorId;
  
  const [selectedTime, setSelectedTime] = useState(null);
  const [visitType, setVisitType] = useState('in-clinic');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    fetchSettingsAndSlots();
  }, []);

  const fetchSettingsAndSlots = async () => {
    setLoading(true);
    try {
      const { data: docSettings } = await supabase.from('doctor_settings').select('*').limit(1).single();
      const s = docSettings || { start_time: '09:00', end_time: '17:00', slot_duration: 30, is_available: true };
      setSettings(s);

      const today = new Date().toISOString().split('T')[0];
      const { data: appointments } = await supabase.from('appointments').select('time, status').eq('date', today).not('status', 'eq', 'cancelled');
      
      // extremely basic mapping, mock data doesn't use proper format for this UI anyway
      const booked = appointments ? appointments.map(a => a.time) : [];
      setBookedSlots(booked);
      
    } catch (e) {
      console.log('Error fetching slots:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const nextOrder = bookedSlots.length + 1; 
      const today = new Date().toISOString().split('T')[0];
      
      await supabase.from('appointments').insert([{
        patient_id: user.id || 'mock',
        date: today,
        time: selectedTime,
        status: 'waiting',
        queue_order: nextOrder
      }]);
      Alert.alert('Success', 'Appointment booked successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = settings ? generateTimeSlots(settings.start_time, settings.end_time, settings.slot_duration) : [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary[100], theme.colors.neutral[50], theme.colors.neutral[50]]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={{paddingBottom: 40}}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Phone size={20} color={theme.colors.neutral[900]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <MessageCircle size={20} color={theme.colors.neutral[900]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Doctor Info Section */}
          <View style={styles.doctorInfoContainer}>
            <View style={styles.doctorTextContent}>
              <View style={styles.idBadge}>
                <Typography variant="caption" color="neutral.500" style={{fontWeight: 'bold'}}>ID: 0269784</Typography>
              </View>
              <Typography variant="h1" color="neutral.900" style={styles.doctorName}>
                Dr. Vivek{'\n'}S
              </Typography>
              <Typography variant="bodyLg" color="neutral.500" style={{marginBottom: 24}}>Cardiologist</Typography>

              <Typography variant="caption" color="neutral.500">Starting from</Typography>
              <Typography variant="h3" color="neutral.900" style={{fontWeight: 'bold'}}>
                ₹1200 <Typography variant="caption" color="neutral.500">/per session</Typography>
              </Typography>
            </View>

            <View style={styles.doctorImageWrap}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' }} 
                style={styles.doctorImage} 
                resizeMode="contain" 
              />
            </View>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Star size={14} color={theme.colors.neutral[900]} fill={theme.colors.neutral[900]} style={{marginRight: 6}} />
              <Typography variant="caption" color="neutral.900" style={{fontWeight: 'bold'}}>4.8</Typography>
            </View>
            <View style={styles.badge}>
              <Calendar size={14} color={theme.colors.neutral[900]} style={{marginRight: 6}} />
              <Typography variant="caption" color="neutral.900" style={{fontWeight: 'bold'}}>10+</Typography>
            </View>
            <View style={styles.badge}>
              <Users size={14} color={theme.colors.primary[500]} fill={theme.colors.primary[500]} style={{marginRight: 6}} />
              <Typography variant="caption" color="neutral.900" style={{fontWeight: 'bold'}}>Patients Served: 120+</Typography>
            </View>
          </View>

          {/* Availability Section */}
          <View style={styles.availabilitySection}>
            <Typography variant="h3" color="neutral.900" style={{marginBottom: 16}}>
              Today's{'\n'}Availability
            </Typography>

            {/* In-Clinic / Virtual Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, visitType === 'in-clinic' && styles.toggleBtnActive]}
                onPress={() => setVisitType('in-clinic')}
              >
                <View style={styles.toggleDot} />
                <Typography variant="bodyMd" color={visitType === 'in-clinic' ? 'neutral.0' : 'neutral.500'} style={{fontWeight: 'bold'}}>
                  In-Clinic
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toggleBtn, visitType === 'virtual' && styles.toggleBtnActive]}
                onPress={() => setVisitType('virtual')}
              >
                <View style={[styles.toggleDot, {backgroundColor: theme.colors.neutral[300]}]} />
                <Typography variant="bodyMd" color={visitType === 'virtual' ? 'neutral.0' : 'neutral.500'} style={{fontWeight: 'bold'}}>
                  Virtual
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Time Grid */}
            {loading ? (
              <View style={styles.timeGrid}>
                {[1,2,3,4,5,6].map(i => <SkeletonLoader key={i} width="30%" height={48} borderRadius={24} />)}
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {timeSlots.map(time => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timePill,
                        isSelected && styles.timePillSelected
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Typography 
                        variant="caption" 
                        color={isSelected ? 'neutral.0' : 'neutral.700'}
                        style={{fontWeight: 'bold'}}
                      >
                        {time}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.bookBtn, !selectedTime && {opacity: 0.5}]} 
            onPress={handleBook}
            disabled={!selectedTime || submitting}
          >
            <View style={{flex: 1}} />
            <Typography variant="bodyMd" color="neutral.0" style={{fontWeight: 'bold', fontSize: 16}}>
              {submitting ? 'Confirming...' : 'Booking...'}
            </Typography>
            <View style={[styles.bookIconWrap, {marginLeft: 12}]}>
              <ChevronRight size={20} color={theme.colors.primary[500]} />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50], // fallback
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 16,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  doctorInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  doctorTextContent: {
    flex: 1,
    zIndex: 2,
    marginTop: 20,
  },
  idBadge: {
    backgroundColor: theme.colors.neutral[0],
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  doctorName: {
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 4,
  },
  doctorImageWrap: {
    position: 'absolute',
    right: -20,
    top: -50,
    width: 180,
    height: 250,
    zIndex: 1,
  },
  doctorImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  badgesRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...theme.shadow.card,
    elevation: 2,
  },
  availabilitySection: {
    backgroundColor: theme.colors.neutral[0],
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 30,
    padding: 6,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary[500],
    ...theme.shadow.card,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success[500],
    marginRight: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  timePill: {
    width: '31%',
    height: 48,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePillSelected: {
    backgroundColor: theme.colors.primary[500],
  },
  footer: {
    backgroundColor: theme.colors.neutral[0],
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
    height: 60,
    borderRadius: 30,
    paddingLeft: 24,
    paddingRight: 8,
  },
  bookIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  }
});
