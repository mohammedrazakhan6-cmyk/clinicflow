import AsyncStorage from '@react-native-async-storage/async-storage';
// Comment out the real Supabase client
// import 'react-native-url-polyfill/auto';
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://wuavxsqhfqdbbvovcnee.supabase.co';
// const supabaseAnonKey = '...'; // Removed for clarity

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     storage: AsyncStorage,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,
//   },
// });

// ==========================================
// MOCK SUPABASE CLIENT (Frontend Only Mode)
// ==========================================

const dummyUser = {
  id: 'mock-user-123',
  email: 'mock@demo.com'
};

const dummyProfile = {
  id: 'mock-user-123',
  role: 'patient', // 'patient', 'doctor', 'admin'
  name: 'Arjun Kumar',
  phone: '+91 98765 43210',
  age: 30,
  gender: 'Male'
};

const dummyAppointments = [
  { id: 1, patient_id: dummyUser.id, date: new Date().toISOString().split('T')[0], time: '10:00 AM', status: 'waiting', queue_order: 1, token_number: 1, notes: null, users: { name: 'Arjun Kumar', phone: '+91 98765 43210' } },
  { id: 2, patient_id: 'other-1', date: new Date().toISOString().split('T')[0], time: '10:30 AM', status: 'waiting', queue_order: 2, token_number: 2, notes: null, users: { name: 'Priya Sharma', phone: '+91 87654 32109' } },
  { id: 3, patient_id: 'other-2', date: new Date().toISOString().split('T')[0], time: '11:00 AM', status: 'completed', queue_order: 3, token_number: 3, notes: 'All good', users: { name: 'Rahul Patel', phone: '+91 76543 21098' } }
];

const dummySettings = {
  start_time: '09:00:00',
  end_time: '17:00:00',
  slot_duration: 30,
  max_patients: 20,
  is_available: true
};

let authListeners = [];

const notifyListeners = (event, session) => {
  authListeners.forEach(cb => cb(event, session));
};

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: dummyUser }, error: null }),
    onAuthStateChange: (callback) => {
      authListeners.push(callback);
      // simulate no session initially
      setTimeout(() => callback('INITIAL_SESSION', null), 100);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners = authListeners.filter(cb => cb !== callback);
            }
          }
        }
      };
    },
    signUp: async (opts) => {
      const session = { user: dummyUser };
      notifyListeners('SIGNED_IN', session);
      return { data: { user: dummyUser, session }, error: null };
    },
    signInWithPassword: async (opts) => {
      let role = 'patient';
      if (opts.email?.toLowerCase().includes('doctor')) role = 'doctor';
      if (opts.email?.toLowerCase().includes('admin')) role = 'admin';

      dummyProfile.role = role;

      const session = { user: dummyUser };
      notifyListeners('SIGNED_IN', session);
      return { data: { user: dummyUser, session }, error: null };
    },
    signOut: async () => {
      notifyListeners('SIGNED_OUT', null);
      return { error: null };
    },
  },
  from: (table) => ({
    select: (columns) => ({
      eq: (col, val) => ({
        single: async () => {
          if (table === 'users' && val === dummyUser.id) return { data: dummyProfile, error: null };
          if (table === 'appointments') return { data: dummyAppointments[0], error: null };
          return { data: null, error: null };
        },
        in: (col2, arr) => ({
          order: () => ({
            order: () => ({
              limit: () => ({ single: async () => ({ data: dummyAppointments[0], error: null }) })
            })
          })
        }),
        not: () => ({
          then: (cb) => {
            if (table === 'appointments') return cb({ data: dummyAppointments, error: null });
            return cb({ data: [], error: null });
          }
        }),
        then: (cb) => {
          if (table === 'appointments' && col === 'date') return cb({ data: dummyAppointments, error: null });
          if (table === 'users') return cb({ data: dummyProfile, error: null });
          return cb({ data: [], error: null });
        }
      }),
      limit: () => ({ single: async () => ({ data: table === 'doctor_settings' ? dummySettings : null, error: null }) }),
      single: async () => ({ data: table === 'doctor_settings' ? dummySettings : null, error: null }),
      then: (cb) => {
        if (table === 'appointments') return cb({ data: dummyAppointments, error: null });
        return cb({ data: null, error: null });
      }
    }),
    insert: async (data) => ({ data, error: null }),
    update: () => ({ eq: async () => ({ error: null }) }),
    upsert: async () => ({ error: null })
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) })
  }),
  removeChannel: () => { },
  rpc: async () => ({ error: null })
};
