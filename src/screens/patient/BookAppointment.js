import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/Typography';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { theme } from '../../styles/theme';
import { supabase } from '../../api/supabase';
import { ArrowLeft, Phone, MessageCircle, Star, Calendar, Users, ChevronRight } from 'lucide-react-native';
import maleDoc from '../../../assets/onboarding/doctorprofile.png';


const generateTimeSlots = (start, end, durationMins, bookedSlots, isToday) => {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  while (h < eh || (h === eh && m < em)) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    const timeString = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;

    // Check if slot is in the past (only if date is today)
    const isPast = isToday && (h < currentHour || (h === currentHour && m <= currentMin));

    // Check if slot is booked
    const isBooked = bookedSlots.includes(timeString);

    slots.push({
      time: timeString,
      isPast,
      isBooked,
      status: isBooked ? 'BOOKED' : (isPast ? 'PAST' : 'AVAILABLE')
    });

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

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState(null);
  const [visitType, setVisitType] = useState('in-clinic');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    fetchSettingsAndSlots();

    // Real-time subscription
    const sub = supabase
      .channel('appointments-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `date=eq.${selectedDate}` },
        fetchSettingsAndSlots
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [selectedDate]);

  const fetchSettingsAndSlots = async () => {
    setLoading(true);
    try {
      // Get Doctor Details and Settings
      const { data: doctorData } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', doctorId)
        .single();

      const { data: docSettings } = await supabase.from('doctor_settings').select('*').limit(1).single();
      const s = docSettings || { start_time: '09:00', end_time: '17:00', slot_duration: 30, is_available: true, max_patients: 20 };

      setSettings({ ...s, doctor: doctorData });

      // Get Appointments for this doctor on selected date
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('time, status')
        .eq('date', selectedDate)
        .eq('doctor_id', doctorId)
        .not('status', 'eq', 'cancelled');

      setAppointments(appointmentsData || []);

      // Map database TIME (HH:MM:SS) to UI format (HH:MM AM/PM) for matching
      const booked = (appointmentsData || []).map(a => {
        const [h, m] = a.time.split(':');
        const hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayH = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      });
      setBookedSlots(booked);

    } catch (e) {
      console.log('Error fetching slots:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTime) return;

    console.log("Selected Time:", selectedTime);
    console.log("Doctor ID:", doctorId);

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: maxData, error: maxError } = await supabase
        .from('appointments')
        .select('queue_order, token')
        .eq('date', selectedDate)
        .eq('doctor_id', doctorId)
        .order('queue_order', { ascending: false })
        .limit(1);

      if (maxError) {
        console.log("Max fetch error:", maxError);
        throw maxError;
      }

      const lastQueueOrder = maxData?.[0]?.queue_order || 0;
      const lastTokenNumber = maxData?.[0]?.token || 0;

      const queue_order = lastQueueOrder + 1;
      const token_number = lastTokenNumber + 1;

      // 2. Convert AM/PM time to 24h ISO for DB
      let [time, period] = selectedTime.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      const dbTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

      // 3. Insert into appointments
      const { error } = await supabase.from('appointments').insert([{
        patient_id: user.id,
        doctor_id: doctorId,
        date: selectedDate,
        time: dbTime,
        status: 'waiting',
        queue_order,
        token: token_number
      }]);

      if (error) throw error;

      Alert.alert('Success', `Your appointment has been booked! Your Token Number is ${token_number}`, [
        { text: 'OK', onPress: () => navigation.navigate('PatientHome') }
      ]);
    } catch (e) {
      Alert.alert('Booking Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isLimitReached = settings && appointments.length >= settings.max_patients;
  const isDoctorUnavailable = settings && !settings.is_available;
  const timeSlots = settings ? generateTimeSlots(settings.start_time, settings.end_time, settings.slot_duration, bookedSlots, selectedDate === today) : [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary[100], theme.colors.neutral[50], theme.colors.neutral[50]]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
            {/* Removed redundant icons */}
          </View>

          {/* Doctor Info Section */}
          <View style={styles.doctorInfoContainer}>
            <View style={styles.doctorTextContent}>
              <View style={styles.idBadge}>
                <Typography variant="caption" color="neutral.500" style={{ fontWeight: 'bold' }}>ID: {doctorId?.substring(0, 8) || '0269784'}</Typography>
              </View>
              <Typography variant="h1" color="neutral.900" style={styles.doctorName}>
                {settings?.doctor?.name || 'Dr. Rajesh Sharma'}
              </Typography>
              <Typography variant="bodyLg" color="neutral.500" style={{ marginBottom: 20 }}>{settings?.doctor?.role || 'General Physician'}</Typography>

              <View style={styles.heroPriceRow}>
                <Typography variant="caption" color="neutral.500">Consultation Fee</Typography>
                <Typography variant="h3" color="neutral.900" style={{ fontWeight: 'bold' }}>
                  ₹1000 <Typography variant="caption" color="neutral.500">/per session</Typography>
                </Typography>
              </View>
            </View>

            <View style={styles.doctorImageWrap}>
              <Image
                source={require('../../../assets/onboarding/doctorprofile.png')}
                // source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' }}
                style={styles.doctorImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Star size={14} color={theme.colors.neutral[900]} fill={theme.colors.neutral[900]} style={{ marginRight: 6 }} />
              <Typography variant="caption" color="neutral.900" style={{ fontWeight: 'bold' }}>4.8</Typography>
            </View>
            <View style={styles.badge}>
              <Calendar size={14} color={theme.colors.neutral[900]} style={{ marginRight: 6 }} />
              <Typography variant="caption" color="neutral.900" style={{ fontWeight: 'bold' }}>10+ Years</Typography>
            </View>
            <View style={styles.badge}>
              <Users size={14} color={theme.colors.primary[500]} fill={theme.colors.primary[500]} style={{ marginRight: 6 }} />
              <Typography variant="caption" color="primary.500" style={{ fontWeight: 'bold' }}>120+</Typography>
            </View>
          </View>

          {/* Availability Section */}
          <View style={styles.availabilitySection}>
            <Typography variant="h3" color="neutral.900" style={{ marginBottom: 20 }}>
              Booking Slots
            </Typography>

            {/* Date Selection */}
            <View style={[styles.toggleContainer, { marginBottom: 16 }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, selectedDate === today && styles.toggleBtnActive]}
                onPress={() => { setSelectedDate(today); setSelectedTime(null); }}
              >
                <Typography variant="bodyMd" color={selectedDate === today ? 'neutral.0' : 'neutral.500'} style={{ fontWeight: 'bold' }}>
                  Today
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, selectedDate === tomorrow && styles.toggleBtnActive]}
                onPress={() => { setSelectedDate(tomorrow); setSelectedTime(null); }}
              >
                <Typography variant="bodyMd" color={selectedDate === tomorrow ? 'neutral.0' : 'neutral.500'} style={{ fontWeight: 'bold' }}>
                  Tomorrow
                </Typography>
              </TouchableOpacity>
            </View>

            {/* In-Clinic / Virtual Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, visitType === 'in-clinic' && styles.toggleBtnActive]}
                onPress={() => setVisitType('in-clinic')}
              >
                <View style={[styles.toggleDot, { backgroundColor: theme.colors.success[500] }]} />
                <Typography variant="bodyMd" color={visitType === 'in-clinic' ? 'neutral.0' : 'neutral.500'} style={{ fontWeight: 'bold' }}>
                  In-Clinic
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, visitType === 'virtual' && styles.toggleBtnActive]}
                onPress={() => setVisitType('virtual')}
              >
                <View style={[styles.toggleDot, { backgroundColor: theme.colors.warning[500] }]} />
                <Typography variant="bodyMd" color={visitType === 'virtual' ? 'neutral.0' : 'neutral.500'} style={{ fontWeight: 'bold' }}>
                  Virtual
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Limit Reached Banner */}
            {isLimitReached && (
              <View style={styles.limitBanner}>
                <Typography variant="bodyMd" color="error.500" style={{ fontWeight: 'bold' }}>
                  Today's booking limit reached
                </Typography>
              </View>
            )}

            {isDoctorUnavailable && !isLimitReached && (
              <View style={styles.limitBanner}>
                <Typography variant="bodyMd" color="error.500" style={{ fontWeight: 'bold' }}>
                  Doctor is not available today
                </Typography>
              </View>
            )}

            {/* Time Grid */}
            {loading ? (
              <View style={styles.timeGrid}>
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLoader key={i} width="30%" height={48} borderRadius={24} />)}
              </View>
            ) : (
              <View style={[styles.timeGrid, (isDoctorUnavailable || isLimitReached) && { opacity: 0.5 }]}>
                {timeSlots.map(slot => {
                  const isSelected = selectedTime === slot.time;
                  const isBooked = slot.status === 'BOOKED';
                  const isPast = slot.status === 'PAST';
                  const isDisabled = isBooked || isPast || isDoctorUnavailable || isLimitReached;

                  return (
                    <TouchableOpacity
                      key={slot.time}
                      style={[
                        styles.timePill,
                        isSelected && styles.timePillSelected,
                        isBooked && styles.timePillBooked,
                        isPast && styles.timePillPast
                      ]}
                      onPress={() => !isDisabled && setSelectedTime(slot.time)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <Typography
                        variant="caption"
                        color={isSelected ? 'neutral.0' : (isDisabled ? 'neutral.400' : 'neutral.700')}
                        style={{ fontWeight: 'bold' }}
                      >
                        {slot.time}
                      </Typography>
                      {isBooked && (
                        <Typography variant="caption" color="neutral.400" style={{ fontSize: 8 }}>
                          Booked
                        </Typography>
                      )}
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
            style={[
              styles.bookBtn,
              (!selectedTime || submitting || isLimitReached || isDoctorUnavailable) && styles.bookBtnDisabled
            ]}
            onPress={handleBook}
            disabled={!selectedTime || submitting || isLimitReached || isDoctorUnavailable}
          >
            <Typography variant="bodyLg" color={selectedTime ? 'neutral.0' : 'neutral.500'} style={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
              {submitting ? 'Processing...' : (selectedTime ? 'Confirm Booking' : 'Select a Slot')}
            </Typography>
            {selectedTime && !submitting && (
              <View style={styles.bookIconWrap}>
                <ChevronRight size={20} color={theme.colors.primary[500]} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
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
    ...theme.shadow.card,
    elevation: 2,
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
    ...theme.shadow.card,
    elevation: 1,
  },
  doctorName: {
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  heroPriceRow: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  doctorImageWrap: {
    position: 'absolute',
    right: -10,
    top: -30,
    width: 160,
    height: 220,
    zIndex: 1,
  },
  doctorImage: {
    width: '100%',
    height: '100%',
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
    minHeight: 400,
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
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary[500],
    ...theme.shadow.card,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  limitBanner: {
    backgroundColor: theme.colors.error[50],
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  availabilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: theme.colors.neutral[50],
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timePill: {
    width: '30%',
    height: 54,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  timePillSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  timePillBooked: {
    backgroundColor: theme.colors.neutral[100],
    borderColor: theme.colors.neutral[100],
    opacity: 0.6,
  },
  timePillPast: {
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[100],
    opacity: 0.4,
  },
  footer: {
    backgroundColor: theme.colors.neutral[0],
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 24,
  },
  bookBtnDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  bookIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
  }
});
