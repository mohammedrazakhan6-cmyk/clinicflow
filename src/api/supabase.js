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

let dummyUsers = [
  { id: dummyUser.id, name: 'Arjun Kumar', phone: '+91 98765 43210', age: 30, gender: 'Male', role: 'patient' },
  { id: 'other-1', name: 'Priya Sharma', phone: '+91 87654 32109' },
  { id: 'other-2', name: 'Rahul Patel', phone: '+91 76543 21098' },
  { id: 'other-3', name: 'Sneha Gupta', phone: '+91 65432 10987' }
];

let dummyDoctors = [
  { id: 'doc-1', name: 'Dr. Anil Kumar', is_available: true },
  { id: 'doc-2', name: 'Dr. Sanjay Patel', is_available: true }
];

let dummyAppointments = [
  { id: 1, patient_id: dummyUser.id, doctor_id: 'doc-1', date: new Date().toISOString().split('T')[0], time: '10:00', status: 'waiting', queue_order: 1, notes: null, users: { name: 'Arjun Kumar', phone: '+91 98765 43210' }, doctors: { name: 'Dr. Anil Kumar' } },
  { id: 2, patient_id: 'other-1', doctor_id: 'doc-1', date: new Date().toISOString().split('T')[0], time: '10:30', status: 'waiting', queue_order: 2, notes: null, users: { name: 'Priya Sharma', phone: '+91 87654 32109' }, doctors: { name: 'Dr. Anil Kumar' } },
  { id: 3, patient_id: 'other-2', doctor_id: 'doc-2', date: new Date().toISOString().split('T')[0], time: '11:00', status: 'completed', queue_order: 1, notes: 'All good', users: { name: 'Rahul Patel', phone: '+91 76543 21098' }, doctors: { name: 'Dr. Sanjay Patel' } },
  { id: 4, patient_id: 'other-3', doctor_id: 'doc-2', date: new Date().toISOString().split('T')[0], time: '11:15', status: 'waiting', queue_order: 2, notes: null, users: { name: 'Sneha Gupta', phone: '+91 65432 10987' }, doctors: { name: 'Dr. Sanjay Patel' } }
];

let dummySettings = [
  {
    id: 'set-1',
    doctor_id: 'doc-1',
    start_time: '09:00:00',
    end_time: '17:00:00',
    slot_duration: 30,
    max_patients: 20,
    is_available: true
  },
  {
    id: 'set-2',
    doctor_id: 'doc-2',
    start_time: '09:00:00',
    end_time: '17:00:00',
    slot_duration: 15,
    max_patients: 40,
    is_available: true
  }
];

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
      // In a real app, Admins use the Supabase Admin API to create users without logging themselves in.
      // Here, we just generate a mock user and return it without triggering a global session change.
      const newUserId = 'walkin-' + Math.random().toString(36).substring(2, 9);
      const newUser = { id: newUserId, email: opts.email };
      const session = { user: newUser };
      return { data: { user: newUser, session }, error: null };
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
  from: (table) => {
    let filters = [];
    const chain = {
      select: () => chain,
      eq: (col, val) => { filters.push({ type: 'eq', col, val }); return chain; },
      in: () => chain,
      not: () => chain,
      order: () => chain,
      limit: () => chain,
      single: async () => {
        if (table === 'users') return { data: dummyProfile, error: null };
        if (table === 'appointments') return { data: dummyAppointments[0], error: null };
        if (table === 'doctor_settings') return { data: dummySettings[0], error: null };
        if (table === 'doctors') return { data: dummyDoctors[0], error: null };
        return { data: null, error: null };
      },
      then: (cb) => {
        if (table === 'users') return cb({ data: dummyProfile, error: null });
        if (table === 'appointments') {
          let res = [...dummyAppointments];
          filters.forEach(f => {
            if (f.type === 'eq') res = res.filter(a => a[f.col] === f.val);
          });
          return cb({ data: res, error: null });
        }
        if (table === 'doctor_settings') return cb({ data: dummySettings, error: null });
        if (table === 'doctors') return cb({ data: dummyDoctors, error: null });
        return cb({ data: [], error: null });
      }
    };
    return {
      select: () => chain,
      insert: async (data) => {
        if (table === 'users') {
          data.forEach(d => dummyUsers.push(d));
        }
        if (table === 'appointments') {
          data.forEach(item => {
            const user = dummyUsers.find(u => u.id === item.patient_id);
            const doc = dummyDoctors.find(d => d.id === item.doctor_id);
            dummyAppointments.push({
              id: dummyAppointments.length + 1,
              ...item,
              users: user ? { name: user.name, phone: user.phone } : { name: 'Unknown', phone: 'N/A' },
              doctors: doc ? { name: doc.name } : { name: 'Unknown' }
            });
          });
        }
        return { data, error: null };
      },
      update: (updates) => {
        return {
          eq: async (col, val) => {
            if (table === 'appointments') {
              dummyAppointments = dummyAppointments.map(a =>
                a[col] === val ? { ...a, ...updates } : a
              );
            }
            if (table === 'users') {
              dummyUsers = dummyUsers.map(u =>
                u[col] === val ? { ...u, ...updates } : u
              );
              // Also update dummyProfile if it's the current user
              if (dummyProfile.id === val) {
                Object.assign(dummyProfile, updates);
              }
            }
            return { error: null };
          }
        };
      },
      upsert: async (data) => {
        if (table === 'doctor_settings') {
          const idx = dummySettings.findIndex(s => s.doctor_id === data.doctor_id);
          if (idx >= 0) dummySettings[idx] = { ...dummySettings[idx], ...data };
          else dummySettings.push(data);
        }
        return { error: null };
      },
      delete: () => chain,
    };
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({}) })
  }),
  removeChannel: () => { },
  rpc: async () => ({ error: null })
};
