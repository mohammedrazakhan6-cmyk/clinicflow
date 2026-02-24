-- ==========================================
-- 1️⃣ USERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role TEXT CHECK (role IN ('patient', 'doctor', 'admin')) NOT NULL DEFAULT 'patient',
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2️⃣ APPOINTMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Nullable for walk-ins
    walk_in_id UUID REFERENCES walk_ins(id) ON DELETE CASCADE, -- Proper reference
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Link to doctor
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL,
    status TEXT CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'no_show')) NOT NULL DEFAULT 'waiting',
    queue_order INTEGER NOT NULL,
    token_number INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3️⃣ WALK_INS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS walk_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    doctor_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4️⃣ DOCTOR_SETTINGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS doctor_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    slot_duration INTEGER NOT NULL DEFAULT 15,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    max_patients INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5️⃣ ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_ins ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6️⃣ DEMO POLICIES (Authenticated Full Access)
-- ==========================================

-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "Users full access (demo)" ON users;
DROP POLICY IF EXISTS "Appointments full access (demo)" ON appointments;
DROP POLICY IF EXISTS "Doctor settings full access (demo)" ON doctor_settings;
DROP POLICY IF EXISTS "Walk-ins full access (demo)" ON walk_ins;

CREATE POLICY "Users full access (demo)" 
ON users FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Appointments full access (demo)" 
ON appointments FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Doctor settings full access (demo)" 
ON doctor_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Walk-ins full access (demo)" 
ON walk_ins FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- 7️⃣ REALTIME ENABLEMENT
-- ==========================================

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE appointments, doctor_settings, walk_ins;
